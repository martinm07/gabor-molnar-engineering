import { useDebounce } from "runed";
import { generateCompContentStr } from "../components/component.svelte";
import { comps, updateCompEdit } from "../components/libraryeditor.svelte";
import {
  reconstructHTMLString,
  patchMutations,
  type DocNodeMap,
  type DocPatch,
  type StringPosNodeMap,
  type DocPatchStr,
  generatePosNodes,
  applyPatches,
} from "./docsyncing";
import {
  doc,
  localSave,
  localSaveEntryIsDoc,
  pruneLocalSave,
} from "../store.svelte";
import { editorState } from "../url.svelte";
import { fetch_ } from "/shared/helper";
import { isHistoryNotBodyContainer } from "../helper";

const getDocumentID = () =>
  editorState.mode === "document"
    ? Number.parseInt(editorState.resourceName)
    : null;
const getComponentID = () =>
  editorState.mode === "component" ? editorState.resourceName : null;

// Time between subsequent server syncs, in ms
const SERVER_SYNC_INTERVAL_TIME = 5000;

interface SaveDocConstructor {
  makePatches: () => ReturnType<typeof patchMutations>;
  getDocEl: () => HTMLElement | undefined;
  docNodes: DocNodeMap;
  stringPosNodeMap: StringPosNodeMap;
  doServerSync?: boolean;
  debug?: boolean;
}

export class SaveDoc {
  serverSyncInterval: NodeJS.Timeout | undefined;
  serverSyncPatchesQueue: DocPatchStr[] = [];
  prevFetch: Promise<Response> | null = null;
  doServerSync: boolean;
  // syncDocMetadataDebounce: (info: typeof doc.info) => void;
  // syncDocMetadataDebounce: typeof useDebounce<Array<typeof doc.info>>;
  syncDocMetadataDebounce: ReturnType<
    typeof useDebounce<[typeof doc.info], void>
  >;

  prevDocumentType: typeof editorState.mode | null = null;
  prevDocumentID: typeof editorState.resourceName | null = null;
  // prevDocInfo: typeof doc.info | null = null;

  makePatches: () => ReturnType<typeof patchMutations>;
  getDocEl: () => HTMLElement | undefined;
  syncingHTMLStr = "";

  docNodes: DocNodeMap;
  stringPosNodeMap: StringPosNodeMap;

  debug: boolean = false;
  private appHTMLStr = "";

  constructor(p: SaveDocConstructor) {
    if (SERVER_SYNC_INTERVAL_TIME > 0)
      this.serverSyncInterval = setInterval(
        () => this.syncServerDocPatch(getDocumentID()),
        SERVER_SYNC_INTERVAL_TIME,
      );

    this.syncDocMetadataDebounce = useDebounce(
      (info: typeof doc.info) => {
        this.syncDocMetadata(info);
      },
      () => SERVER_SYNC_INTERVAL_TIME,
    );

    this.getDocEl = p.getDocEl;
    this.docNodes = p.docNodes;
    this.stringPosNodeMap = p.stringPosNodeMap;
    this.makePatches = p.makePatches;
    this.doServerSync = p.doServerSync ?? true;
    this.debug = p.debug ?? false;
  }

  /**
   * Does local sync and server sync, and determines whether or not to make patches of any changes
   * (primarily by if the changes were simply the loading of the document/component, or if the document/component was being edited)
   * @returns Patches, stringPosForwardUpdateMap, stringPosBackwardUpdateMap, HTML string
   */
  save(): ReturnType<typeof patchMutations> {
    // Check if the loaded document just changed
    if (
      this.prevDocumentType !== editorState.mode ||
      this.prevDocumentID !== editorState.resourceName
    ) {
      // Flush the serverSyncPatches queue
      if (this.prevDocumentType === "document" && this.prevDocumentID) {
        // Apply the patches
        this.syncServerDocPatch(Number.parseInt(this.prevDocumentID));
      } else {
        // If the previous loading document was not of document type, then there shouldn't be any patches,
        //  but just to be safe we splice the queue anyway.
        this.serverSyncPatchesQueue.splice(
          0,
          this.serverSyncPatchesQueue.length,
        );
      }

      // Clear docNodes and stringPosNodeMap
      this.docNodes.keys().forEach((key) => this.docNodes.delete(key));
      this.stringPosNodeMap
        .keys()
        .forEach((key) => this.stringPosNodeMap.delete(key));

      let syncedHTMLStr: string | undefined;
      if (editorState.mode === "document") {
        syncedHTMLStr = this.syncDocFull();
      } else if (editorState.mode === "component") {
        syncedHTMLStr = this.syncCompLocal();
      }

      if (syncedHTMLStr === undefined) {
        console.error("Full document sync failed.");
      } else {
        this.prevDocumentType = editorState.mode;
        this.prevDocumentID = editorState.resourceName;

        this.appHTMLStr = syncedHTMLStr;
        return [[], new Map(), new Map(), syncedHTMLStr];
      }
    }

    const [patches, historyForwardMap, historyBackwardMap, htmlStr] =
      this.makePatches();

    if (editorState.mode === "document") {
      // this.syncDocLocal(htmlStr);
      this.serverSyncPatchesQueue.push(...patches.map((patch) => patch.str_));
    } else if (editorState.mode === "component") {
      this.syncCompLocal(htmlStr);
    }

    this.prevDocumentType = editorState.mode;
    this.prevDocumentID = editorState.resourceName;

    this.appHTMLStr = htmlStr;
    return [patches, historyForwardMap, historyBackwardMap, htmlStr];
  }

  flushServerChanges() {
    this.syncServerDocPatch(getDocumentID());
    this.syncDocMetadataDebounce.runScheduledNow();
  }

  /**
   * Generates the full HTML string for the currently active document body, and syncs it to the server.
   * Also updates the local save through calling `syncDocLocal`.
   *
   * This is done so that when we generate patches for this HTML string later, we can be confident that the HTML string stored on the server
   * has the same formatting and everything i.e. it is exactly identical to the string we're making patches for locally (and not just *functionally* identical).
   *
   * Note: ONLY syncs the document body― not any other document info, as it is expected this will only be called upon initial document loading (and so won't
   * used for syncing any actual changes).
   * TODO: Can add option to sync other document info as well.
   */
  syncDocFull() {
    const documentID = getDocumentID();
    const docEl = this.getDocEl();
    if (documentID === null || !docEl) return;

    const [htmlStr] = reconstructHTMLString(docEl, {
      docNodes: this.docNodes,
      docContainer: docEl,
      includeContainer: false,
      includeHistoryNotBodyEls: true,
    });
    generatePosNodes(this.docNodes, this.stringPosNodeMap);

    let filteredHTMLStr = htmlStr;

    const changes: { start: number; len: number }[] = [];
    this.docNodes.forEach((nodeInfo, node) => {
      if (isHistoryNotBodyContainer(node))
        changes.push({
          start: nodeInfo.stringPos,
          len: nodeInfo.stringLen,
        });
    });

    changes.sort((a, b) => b.start - a.start);

    changes.forEach(
      (change) =>
        (filteredHTMLStr =
          filteredHTMLStr.slice(0, change.start) +
          filteredHTMLStr.slice(change.start + change.len)),
    );

    if (this.debug) {
      console.log("🎈🎈🎈 Syncing htmlStr:\n\n", filteredHTMLStr);
    }

    this.syncingHTMLStr = filteredHTMLStr;
    this.syncDocLocal();

    if (this.doServerSync)
      fetch_("/documents/sync_document_full", {
        method: "post",
        body: JSON.stringify({
          id: documentID,
          body: filteredHTMLStr,
        }),
        keepalive: true,
      });

    return htmlStr;
  }

  /**
   * Applies queued patches to currently active document body.
   *
   * TODO: Also sync other document info when it changes, using the local save of that info (ideally the local save has some field like "dirty" which indicates whether there
   *        are indeed changes that need to be synced).
   */
  syncServerDocPatch(documentID: number | null) {
    if (documentID === null || !this.doServerSync) return;

    const createFetch = () => {
      const patches = this.serverSyncPatchesQueue
        .filter((patch) => {
          return patch.correction !== -1;
        })
        .map((patch) => {
          return {
            index: patch.start - patch.correction,
            length: patch.length,
            value: patch.value,
          };
        });

      // We also use the patches to find what we can store locally for the document
      this.syncingHTMLStr = applyPatches(
        this.syncingHTMLStr,
        patches.map((patch) => {
          return {
            str_: {
              start: patch.index,
              length: patch.length,
              value: patch.value,
            },
          };
        }),
      );
      this.syncDocLocal();

      if (this.debug) {
        console.log("Patches:", structuredClone(this.serverSyncPatchesQueue));
        console.log("App HTML string:\n-------------\n", this.appHTMLStr);
        console.log(
          "New server HTML string (probably):\n---------------\n",
          this.syncingHTMLStr,
        );
      }

      const resp = fetch_("/documents/sync_document_patch", {
        method: "post",
        body: JSON.stringify({
          id: documentID,
          patches,
          complibver: doc.info.componentLibVer,
        }),
      });
      this.serverSyncPatchesQueue.splice(0, this.serverSyncPatchesQueue.length);
      return resp;
    };

    if (this.serverSyncPatchesQueue.length === 0) return;

    if (this.prevFetch === null) this.prevFetch = createFetch();
    else this.prevFetch = this.prevFetch.then(createFetch);
  }

  async syncDocMetadata(info: typeof doc.info) {
    console.log("DOING UPDATE OF METADATA");
    const resp = await fetch_("/documents/update_document_metadata", {
      method: "post",
      body: JSON.stringify({
        id: info.id.trim(),
        title: info.title,
        description: info.description,
        tags: info.tags,
        accent: info.accent,
        thumbnail: info.thumbnail,
        status: info.status,
      }),
    });
    if (!resp.ok) {
      console.log("🎈", resp);
      console.error(await resp.text());
      return;
    }

    const data = await resp.json();
    doc.info.title = data["title"];
    doc.info.description = data["description"];
    doc.info.tags = data["tags"];
    doc.info.accent = data["accent"];
    doc.info.thumbnail = data["thumbnail"];
    doc.info.status = data["status"];
  }

  syncDocLocal() {
    const documentID = getDocumentID();
    const docEl = this.getDocEl();
    if (documentID === null || !docEl) return;

    const docInfoContainer = docEl.querySelector("#doc-info");
    if (docInfoContainer) {
      // TODO: The plan is that other information about the document is stored as part of the HTML,
      //        in hidden elements at the top or bottom of the page.
      //        (that way undo/redo can work on it as well- and any state the editor can edit is just HTML; that seems elegant).
    }

    const savedInfo = localSave.current[`D:${documentID}`];
    if (!savedInfo) {
      if (!doc.info.componentLibVer)
        throw new Error(
          `Tried creating entry in localSave for document of ID "${documentID}" in syncDocLocal, but couldn't as compLibVer.currentVer is null.`,
        );
      localSave.current[`D:${documentID}`] = {
        id: `${documentID}`,
        lastUsed: Date.now(),
        body: this.syncingHTMLStr,
        compLibVer: doc.info.componentLibVer,
      };
    } else if (!localSaveEntryIsDoc(savedInfo))
      throw new Error("Entry wasn't for a document.");
    else {
      savedInfo.lastUsed = Date.now();
      savedInfo.body = this.syncingHTMLStr;
      savedInfo.compLibVer = doc.info.componentLibVer;
      pruneLocalSave();
    }
  }

  /**
   * Saves the component to persistent storage (locally). Used for saving both patches and full loads (distinguished by whether htmlStr is passed in or not).
   * @param htmlStr Pass in the HTML string representing the component if it exists (which it should as this.makePatches() maintains it through updates). If it doesn't exist (i.e. when the component has been newly loaded in) then this function will generate it itself from the current document body, and populate this.docNodes and this.stringPosNodeMap in the process.
   * @returns
   */
  syncCompLocal(htmlStr?: string) {
    const componentID = getComponentID();
    const docEl = this.getDocEl();
    if (componentID === null || !docEl) return;

    const comp = comps.lib.find((comp) => comp.identName === componentID);
    if (!comp) return;

    // The reconstructHTMLString creates the HTML string for the document, taking
    //  into account masked attribute values, and also gives a mapping of nodes to
    //  their indexes and lengths in the generated HTML string, which allows us to
    //  manually insert "data-component" attributes without ever actually affecting
    //  the DOM.
    let nodeMap: DocNodeMap | undefined;
    if (htmlStr === undefined) {
      [htmlStr, nodeMap] = reconstructHTMLString(docEl, {
        docNodes: this.docNodes, // TODO: Should this be included here?
        docContainer: docEl,
        includeContainer: false,
        includeHistoryNotBodyEls: false,
      });

      generatePosNodes(this.docNodes, this.stringPosNodeMap);
    }

    const { content, parts } = generateCompContentStr(
      docEl,
      htmlStr,
      nodeMap ?? this.docNodes,
      comp.name,
    );
    updateCompEdit(componentID, { content, parts });
    return htmlStr;
  }
}

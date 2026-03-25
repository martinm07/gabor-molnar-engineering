import {
  comps,
  generateCompContentStr,
  updateCompEdit,
} from "./components/component.svelte";
import {
  reconstructHTMLString,
  patchMutations,
  type DocNodeMap,
  type DocPatch,
  type StringPosNodeMap,
  type DocPatchStr,
  generatePosNodes,
} from "./docsyncing";
import {
  compLibVer,
  editorState,
  localSave,
  localSaveEntryIsDoc,
  pruneLocalSave,
} from "./store.svelte";
import { fetch_ } from "/shared/helper";

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
}

export class SaveDoc {
  serverSyncInterval: NodeJS.Timeout | undefined;
  serverSyncPatchesQueue: DocPatchStr[] = [];
  prevFetch: Promise<Response> | null = null;

  prevDocumentType: typeof editorState.mode | null = null;
  prevDocumentID: typeof editorState.resourceName | null = null;

  makePatches: () => ReturnType<typeof patchMutations>;
  getDocEl: () => HTMLElement | undefined;

  docNodes: DocNodeMap;
  stringPosNodeMap: StringPosNodeMap;

  constructor(p: SaveDocConstructor) {
    if (SERVER_SYNC_INTERVAL_TIME > 0)
      this.serverSyncInterval = setInterval(
        () => this.syncServerDocPatch(getDocumentID()),
        SERVER_SYNC_INTERVAL_TIME,
      );

    this.getDocEl = p.getDocEl;
    this.docNodes = p.docNodes;
    this.stringPosNodeMap = p.stringPosNodeMap;
    this.makePatches = p.makePatches;
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
        return [[], new Map(), new Map(), syncedHTMLStr];
      }
    }

    const [patches, historyForwardMap, historyBackwardMap, htmlStr] =
      this.makePatches();

    if (editorState.mode === "document") {
      this.syncDocLocal(htmlStr);
      this.serverSyncPatchesQueue.push(...patches.map((patch) => patch.str_));
    } else if (editorState.mode === "component") {
      this.syncCompLocal(htmlStr);
    }

    this.prevDocumentType = editorState.mode;
    this.prevDocumentID = editorState.resourceName;
    return [patches, historyForwardMap, historyBackwardMap, htmlStr];
  }

  flushServerChanges() {
    this.syncServerDocPatch(getDocumentID());
  }

  /**
   * Generates the full HTML string for the currently active document body, and syncs it to the server.\
   * Also updates the local save through calling `syncDocLocal`.\
   * \
   * This is done so that when we generate patches for this HTML string later, we can be confident that the HTML string stored on the server
   *  has the same formatting and everything i.e. it is exactly identical to the string we're making patches for locally (and not just *functionally* identical).\
   * \
   * Note: ONLY syncs the document body― not any other document info, as it is expected this will only be called upon initial document loading (and so won't
   *  used for syncing any actual changes).\
   * TODO: Can add option to sync other document info as well.
   */
  syncDocFull() {
    const documentID = getDocumentID();
    const docEl = this.getDocEl();
    if (documentID === null || !docEl) return;

    const [htmlStr] = reconstructHTMLString(
      docEl,
      {
        docNodes: this.docNodes,
        docContainer: docEl,
      },
      false,
    );

    generatePosNodes(this.docNodes, this.stringPosNodeMap);

    this.syncDocLocal(htmlStr);

    fetch_("/documents/sync_document_full", {
      method: "post",
      body: JSON.stringify({
        id: documentID,
        body: htmlStr,
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
    if (documentID === null) return;

    const createFetch = () => {
      const resp = fetch_("/documents/sync_document_patch", {
        method: "post",
        body: JSON.stringify({
          id: documentID,
          patches: this.serverSyncPatchesQueue.map((patch) => {
            return {
              index: patch.start,
              length: patch.length,
              value: patch.value,
            };
          }),
        }),
      });
      this.serverSyncPatchesQueue.splice(0, this.serverSyncPatchesQueue.length);
      return resp;
    };

    if (this.serverSyncPatchesQueue.length === 0) return;

    if (this.prevFetch === null) this.prevFetch = createFetch();
    else this.prevFetch = this.prevFetch.then(createFetch);
  }

  syncDocLocal(htmlStr: string) {
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
      if (!compLibVer.currentVer)
        throw new Error(
          `Tried creating entry in localSave for document of ID "${documentID}" in syncDocLocal, but couldn't as compLibVer.currentVer is null.`,
        );
      localSave.current[`D:${documentID}`] = {
        id: `${documentID}`,
        lastUsed: Date.now(),
        body: htmlStr,
        compLibVer: compLibVer.currentVer,
      };
    } else if (!localSaveEntryIsDoc(savedInfo))
      throw new Error("Entry wasn't for a document.");
    else {
      savedInfo.lastUsed = Date.now();
      savedInfo.body = htmlStr;
      pruneLocalSave();
    }
  }

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
      [htmlStr, nodeMap] = reconstructHTMLString(
        docEl,
        {
          docNodes: this.docNodes, // TODO: Should this be included here?
          docContainer: docEl,
        },
        false,
      );
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

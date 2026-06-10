import {
  decodeComponentStr,
  type GetCompLibFetchReturn,
} from "./components/component.svelte";
import type { IMultipleSelect } from "./cursormodes/MultipleSelect.svelte";
import { parseHTMLFragment } from "./helper";
import type { HistoryManager } from "./history";
import {
  allComponentTags,
  compLibEdits,
  compLibVer,
  editorState,
  localSave,
  localSaveEntryIsDoc,
  localSaveEntryIsLib,
  mode,
  savedComponents,
  type SavedComponent,
} from "./store.svelte";
import { assign, fetch_, request2AnimationFrames } from "/shared/helper";

interface EditorInterfaceLoading {
  multipleSelect?: IMultipleSelect;
  docEl?: HTMLElement;
  historyManager?: HistoryManager;
}

const getDocumentID = () =>
  editorState.mode === "document"
    ? Number.parseInt(editorState.resourceName)
    : null;
const getComponentID = () =>
  editorState.mode === "component" ? editorState.resourceName : null;

function loadDocBody(body: Node[], p: EditorInterfaceLoading) {
  const documentID = getDocumentID();
  // TODO: What replaces this?
  // patchSync = false;

  while (p.docEl?.firstChild) p.docEl.removeChild(p.docEl.firstChild);
  body.forEach((node) => p.docEl?.appendChild(node));

  p.historyManager?.changeActiveDoc(`${documentID}`);

  // If we are coming back from editing components in the middle
  //  of adding a new node, then we need to recover the editor state
  //  to the point where the user was trying to add a new node
  // TODO: Currently, when we go to edit a component in the middle of editing a node,
  //        the temp-added node is just immediately removed by Sidebar.svelte
  request2AnimationFrames(() => {
    if (!p.docEl) return;
    const tempAdded = Array.from(p.docEl.querySelectorAll(".temp-added"));

    // There is in fact no attempt at adding a new node, thus we return early
    if (tempAdded.length === 0) return;

    p.multipleSelect?.removeSelection();
    p.multipleSelect?.toggleToSelection(tempAdded);
    mode.sidebar = "addcomponent";
  });

  // TODO: This was only in loadComponent originally. Determine what the consequences of having it in loadDocument aswell are
  mode.sidebar = "edit";
  p.multipleSelect?.removeSelection();
}

export async function loadDocument(p: EditorInterfaceLoading) {
  const documentID = getDocumentID();
  if (documentID === null) return;
  // For loss-of-service, where syncing wasn't able to be done with the server,
  //  we rely on local storage in the meantime.
  // syncOffline: if (SYNC_DOC_OFFLINE) {
  //   const savedInfo = offlineDocEdits.current[documentID];
  //   if (!savedInfo || !savedInfo.body) {
  //     console.warn(
  //       "Tried loading from offline data but didn't find any. Attempting to fetch from network.",
  //     );
  //     break syncOffline;
  //   }
  //   loadDocBody({ body: savedInfo.body });
  //   savedComponents.splice(
  //     0,
  //     savedComponents.length,
  //     ...(savedInfo.comps ?? []),
  //   );
  //   return;
  // }

  const resp = await fetch_(`/documents/get_document_edit?id=${documentID}`);

  let data;
  if (!resp.ok) {
    console.warn(
      `Fetching document failed. Will attempt to use local store. Document ID: "${documentID}"`,
    );
    const savedInfo = localSave.current[`D:${documentID}`];
    if (!savedInfo) {
      console.error(
        `Wasn't able to find requested document stored locally. Document ID: "${documentID}"`,
      );
      // savedComponents.splice(0, savedComponents.length);
      data = {
        body: "",
        component_lib_ver: "",
      };
    } else if (!localSaveEntryIsDoc(savedInfo))
      throw new Error("Entry wasn't for a document.");
    else
      data = {
        body: savedInfo.body,
        component_lib_ver: savedInfo.compLibVer,
      };
  } else data = await resp.json();

  // const data = await resp.json();

  console.log(data["body"]);
  const parsedBody = parseHTMLFragment(data["body"], true, true);
  loadDocBody(parsedBody, p);

  const componentLibVer = data["component_lib_ver"];
  if (typeof componentLibVer !== "string")
    throw new Error(
      "'/documents/get_document_edit' didn't return string for key 'component_lib_ver'.",
    );

  localSave.current[`D:${documentID}`] = {
    id: `${documentID}`,
    lastUsed: Date.now(),
    body: data["body"],
    compLibVer: data["component_lib_ver"],
  };

  compLibVer.currentVer = componentLibVer;
  const compLibInfo = await setSavedComponentLibrary(componentLibVer);

  if (!compLibInfo)
    console.error("Couldn't fetch info about component library");
  else {
    compLibVer.upgradeInfo = {
      to_version: compLibInfo.upgrade_to_version,
      name_map: compLibInfo.upgrade_name_map,
      content_list: compLibInfo.upgrade_content_list,
      remove_list: compLibInfo.upgrade_remove_list,
      diff_msgs: compLibInfo.upgrade_diff_msgs,
    };
    compLibVer.latestVer = compLibInfo.upgrade_to_version;
  }
}

async function setSavedComponentLibrary(ver?: string) {
  console.log("getting saved components library");

  const URL = `/documents/get_component_library${typeof ver === "string" ? "?ver=" + ver : ""}`;
  const resp = await fetch_(URL);

  if (!resp.ok) {
    console.warn(
      `Fetching component library version failed. Will attempt to use local store. Version: "${ver ?? "latest"}"`,
    );
    const savedInfo = localSave.current[`L:${ver ?? "latest"}`];
    if (!savedInfo) {
      console.error(
        `Wasn't able to find requested version of component library stored locally. Version: "${ver ?? "latest"}"`,
      );
      savedComponents.splice(0, savedComponents.length);
      return;
    } else if (!localSaveEntryIsLib(savedInfo))
      throw new Error(`Entry wasn't for a component library.`);

    savedComponents.splice(0, savedComponents.length, ...savedInfo.comps);
    return;
  }

  const data: GetCompLibFetchReturn = await resp.json();
  console.log(data);
  //// The response from the server has every field as a string, so we must
  ////  do these conversions for 'tags' and 'parts'.
  // data.forEach((comp) => {
  //   comp["tags"] = (comp["tags"] as unknown as string).split(",");
  //   comp["parts"] = (comp["parts"] as unknown as string).split("|");
  // });
  // savedComponents.update(() => data);

  const components = data.library.map((comp) =>
    Object.assign(comp, { identName: comp.name }),
  );
  savedComponents.splice(0, savedComponents.length, ...components);

  localSave.current[`L:${ver ?? "latest"}`] = {
    version: ver ?? "latest",
    lastUsed: Date.now(),
    comps: components,
  };

  return data;
}

export async function loadComponent(p: EditorInterfaceLoading) {
  const componentID = getComponentID();
  if (componentID === null) return;

  await setSavedComponentLibrary();

  const comp = savedComponents.find((comp) => comp.name === componentID);
  const editMatch = compLibEdits.current.find(
    (edit) => edit.type !== "remove" && edit.identName === componentID,
  );
  if (!comp && !editMatch) {
    if (p.docEl)
      p.docEl.innerHTML =
        "<div>Welcome to purgatory - Please either select or create a component</div>";
  } else {
    // Combine the saved component library with locally stored edits
    const compWithEdits = assign(
      $state.snapshot(comp) ?? {},
      editMatch ?? {},
    ) as SavedComponent;

    const compBody = decodeComponentStr(compWithEdits.content, "component");
    loadDocBody(Array.from(compBody.childNodes), p);
  }

  // Get all currently defined tags, so that autocomplete can be provided when modifying component tags
  const resp = await fetch_("/documents/get_component_tags");
  recoverTags: if (!resp.ok) {
    console.warn(
      "Fetching component tags failed. Will attempt to use local store.",
    );
    const savedInfo = localSave.current[`L:latest`];
    if (!savedInfo) {
      console.error(
        `Wasn't able to find latest version of component library stored locally.`,
      );
      allComponentTags.splice(0, allComponentTags.length);
      break recoverTags;
    } else if (!localSaveEntryIsLib(savedInfo))
      throw new Error(`Entry wasn't for a component library.`);
    else if (!savedInfo.definedTags) {
      console.error(
        `Local entry for latest library version did not include definedTags.`,
      );
      allComponentTags.splice(0, allComponentTags.length);
      break recoverTags;
    }

    allComponentTags.splice(
      0,
      allComponentTags.length,
      ...savedInfo.definedTags,
    );
  } else {
    const data: string[] = await resp.json();
    allComponentTags.splice(0, allComponentTags.length, ...data);

    const latestSavedLib = localSave.current["L:latest"];
    if (latestSavedLib && localSaveEntryIsLib(latestSavedLib))
      latestSavedLib.definedTags = data;
  }

  // Find the current (latest) version of the component library
  const verResp = await fetch_("/documents/savedcomponents_currentversion");
  recoverVer: if (!verResp.ok) {
    console.warn(
      "Fetching latest component library version failed. Will attempt to use local store.",
    );
    const savedInfo = localSave.current[`L:latest`];
    if (!savedInfo) {
      console.error(
        `Wasn't able to find latest version of component library stored locally.`,
      );
      compLibVer.latestVer = null;
      compLibVer.currentVer = null;
      break recoverVer;
    } else if (!localSaveEntryIsLib(savedInfo))
      throw new Error(`Entry wasn't for a component library.`);

    compLibVer.latestVer = savedInfo.version;
    compLibVer.currentVer = savedInfo.version;
  } else {
    const latestVer = await verResp.text();
    compLibVer.latestVer = latestVer;
    compLibVer.currentVer = latestVer;

    const latestSavedLib = localSave.current["L:latest"];
    if (latestSavedLib && localSaveEntryIsLib(latestSavedLib)) {
      latestSavedLib.version = latestVer;
      localSave.current[`L:${latestVer}`] = structuredClone(
        $state.snapshot(latestSavedLib),
      );
    }
  }
}

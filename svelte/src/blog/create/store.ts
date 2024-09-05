import { writable, derived, type Writable } from "svelte/store";
import { elsListConnected } from "./helper";

type CursorMode = "select" | "edit" | "add" | "move" | "noselect";
export const cursorMode: Writable<CursorMode> = writable("select");
type SidebarMode = "edit" | "component" | "viewer";
export const sidebarMode: Writable<SidebarMode> = writable("edit");

export const cssStyles: Writable<Map<Element, [k: string, v: string][]>> =
  writable(new Map());

export const nodeHoverTarget: Writable<Element | undefined> = writable();
export const nodesSelection: Writable<Element[]> = writable([]);
export const nodesIslandSelection = derived(nodesSelection, (nodesSelection) =>
  elsListConnected(nodesSelection),
);

type AutocompleteMode = "css" | "attributes" | "tag" | "component" | null;
export const autocompleteMode: Writable<AutocompleteMode> = writable(null);
export const autocompleteSuggestions: Writable<string[]> = writable([]);

export interface SavedComponent {
  name: string;
  description?: string;
  tags: string[];
  content: string;
  parts: string[];
}

// const comp1 = {
//   name: "new-comp",
//   tags: [],
//   content:
//     "%0A%20%20<p>%0A%20%20%20%20<em>Lorem%20ipsum</>%20dolor%20sit%20amet,%20consectetur%20adipiscing%20elit,%20sed%20do%20eiusmod%20tempor%0A%20%20%20%20incididunt%20ut%20labore%20et%20dolore%20magna%20aliqua.%20Gravida%20in%20fermentum%20et%0A%20%20%20%20sollicitudin%20ac%20orci%20phasellus.%20Ultricies%20integer%20quis%20auctor%20elit%20sed%0A%20%20%20%20vulputate%20mi%20sit%20amet.%20Ultrices%20sagittis%20orci%20a%20scelerisque%20purus%20semper%20eget%0A%20%20%20%20duis%20at.%20Sociis%20natoque%20penatibus%20et%20magnis%20dis%20parturient.%20Ac%20odio%20tempor%0A%20%20%20%20orci%20dapibus%20ultrices%20in.%20Accumsan%20sit%20amet%20nulla%20facilisi%20morbi%20tempus%0A%20%20%20%20iaculis%20urna.%20Commodo%20nulla%20facilisi%20nullam%20vehicula%20ipsum%20a%20arcu.%20Quam%20nulla%0A%20%20%20%20porttitor%20massa%20id%20neque%20aliquam%20vestibulum.%20Parturient%20montes%20nascetur%0A%20%20%20%20ridiculus%20mus%20mauris%20vitae%20<strong>ultricies</>.%20Vitae%20elementum%20curabitur%20vitae%20nunc%20sed%0A%20%20%20%20velit%20dignissim%20sodales%20ut.%20Odio%20pellentesque%20diam%20volutpat%20commodo%20sed%0A%20%20%20%20egestas.%20Et%20ligula%20ullamcorper%20malesuada%20proin%20libero%20nunc%20consequat%20interdum.%0A%20%20%20%20Pretium%20fusce%20id%20velit%20ut.%20Pellentesque%20habitant%20morbi%20tristique%20senectus.%20Sit%0A%20%20%20%20amet%20luctus%20venenatis%20lectus%20magna%20fringilla%20urna%20porttitor.%0A%20%20</>%0A%20%20<p>%0A%20%20%20%20Massa%20placerat%20duis%20ultricies%20lacus%20sed%20turpis%20tincidunt%20id.%20Nunc%20faucibus%20a%0A%20%20%20%20pellentesque%20sit%20amet%20porttitor.%20Tellus%20molestie%20nunc%20non%20blandit%20massa%20enim.%0A%20%20%20%20Mauris%20rhoncus%20aenean%20vel%20elit%20scelerisque%20mauris%20pellentesque%20pulvinar%0A%20%20%20%20pellentesque.%20Diam%20volutpat%20commodo%20sed%20egestas%20egestas%20fringilla%20phasellus.%0A%20%20%20%20Eget%20sit%20amet%20tellus%20cras.%20Curabitur%20vitae%20nunc%20sed%20velit%20dignissim%20sodales%20ut%0A%20%20%20%20eu.%20Sed%20velit%20dignissim%20sodales%20ut%20eu%20sem%20integer%20vitae.%20Nunc%20sed%20blandit%0A%20%20%20%20libero%20volutpat.%20Cursus%20sit%20amet%20dictum%20sit%20amet%20justo%20donec%20enim%20diam.%20Magnis%0A%20%20%20%20dis%20parturient%20montes%20nascetur%20ridiculus%20mus.%20Consequat%20id%20porta%20nibh%0A%20%20%20%20venenatis%20cras%20sed.%20Risus%20feugiat%20in%20ante%20metus%20dictum%20at%20tempor.%20Justo%20eget%0A%20%20%20%20magna%20fermentum%20iaculis.%20Quis%20blandit%20turpis%20cursus%20in%20hac%20habitasse.%0A%20%20</>%0A",
// };
const savedComps_: SavedComponent[] = [
  {
    name: "component1",
    content: "",
    tags: ["food", "recipie"],
    description: "You know what they say; you never forget your first...",
    parts: ["1", "1,1", "1,2"],
  },
  {
    name: "second-comp",
    content: "",
    tags: ["methodology", "general", "sensei"],
    description:
      "Lorem ipsum dolor sit amet consecutor aler to honotni arigatoue gozaimasu",
    parts: ["1", "2", "2,1"],
  },
  {
    name: "third",
    content: "",
    tags: ["edible"],
    description: "third is the one with the edible hairy chest",
    parts: ["1", "2", "3"],
  },
  {
    name: "yon-nin-wa-sutekina-aru",
    content: "",
    tags: ["general", "philosophy"],
    description: "Japanese writing",
    parts: ["1", "1,1", "1,1,1"],
  },
];

export const savedComponents: Writable<SavedComponent[]> =
  writable(savedComps_);

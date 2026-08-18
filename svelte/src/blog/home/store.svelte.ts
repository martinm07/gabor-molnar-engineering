import { on } from "svelte/events";
import { fetch_ } from "/shared/helper";

export const PAGE_SIZE = 6;

export interface IBlogsList {
  recalculateBumps(): void;
}

export interface Card {
  title: string;
  description: string;
  tags: string[];
  accent?: string;
  svgIcon?: string;
  dateUpdated: Temporal.PlainDate;
}

export async function addCards(cards: Card[], num: number) {
  console.log(`Fetching ${num} more cards...`);
  const p = cards.length / num;
  return fetch_(`/documents/get_latest?p=${p}&l=${num}`)
    .then((resp) => resp.json())
    .then((data) => {
      const cardData = data.map(
        ({ title, description, tags, accent, thumbnail, dateUpdated }: any) => {
          return {
            title,
            description,
            tags,
            accent,
            svgIcon: thumbnail,
            dateUpdated: Temporal.PlainDate.from(dateUpdated),
          };
        },
      );
      console.log(cardData);
      cards.push(...cardData);
      return cardData;
    });
}

export interface Tag {
  name: string;
  description?: string;
  accent?: string;
}

export async function getTags(tagsList: Tag[]) {
  return fetch_("/documents/get_doctags")
    .then((resp) => resp.json())
    .then((data) => {
      const tagsData: Tag[] = data.map(
        (tagdata: { [key: string]: string | undefined }) => {
          return {
            name: tagdata["name"],
            description: tagdata["description"],
            accent: tagdata["color"],
          } as Tag;
        },
      );
      tagsList.splice(0, tagsList.length, ...tagsData);
      return tagsData;
    });
}

export async function getCardsForTag(
  tagname: string,
  num: number,
  // cardsList: Card[],
) {
  const params = new URLSearchParams([
    ["name", tagname],
    ["l", `${num}`],
  ]);
  return fetch_(`/documents/get_blogs_tag?${params.toString()}`)
    .then((resp) => resp.json())
    .then((data) => {
      const cardsData: Card[] = data.map(
        ({ title, description, tags, accent, thumbnail, dateUpdated }: any) => {
          const cardData: Card = {
            title,
            description,
            tags,
            accent,
            svgIcon: thumbnail,
            dateUpdated: Temporal.PlainDate.from(dateUpdated),
          };
          return cardData;
        },
      );
      return cardsData;
    });
}

const isMobile = () => window.matchMedia("(width <= 55rem)").matches;

//////////////////

class HomeState {
  showingAll = $state(
    /\/documents\/all\/?/g.test(window.location.pathname) ? true : false,
  );
  isMobile = $state(isMobile());
}

export const homeState = new HomeState();

on(window, "resize", () => {
  homeState.isMobile = isMobile();
});

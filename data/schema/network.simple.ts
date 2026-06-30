import type { StoreOption } from "../../src/types";

export default {
  nodes: 'id',
  links: {
    key: 'id',
    autoIncrement: true,
    index: {
      link_source: { key: 'src', multi: true },
      link_target: { key: 'trg', multi: true },
      link_unique: { key: ['src', 'trg'], unique: true },
    },
  },
  items: {
    key: 'id',
    index: {
      title: 'title',
    }
  }
} as {[store:string]:StoreOption};
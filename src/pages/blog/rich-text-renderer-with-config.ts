import { documentToHtmlString } from '@contentful/rich-text-html-renderer'
import { BLOCKS, MARKS } from '@contentful/rich-text-types'

export const withRichTextRenderConfig = (doc: any) => {
  return documentToHtmlString(doc, {
    renderMark: {
      [MARKS.BOLD]: text => `<span class='text-white font-bold'>${text}</span>`,
    },
    renderNode: {
      [BLOCKS.HEADING_3]: (
        node,
        next,
      ) => ` <h1 class="text-[2.5rem] font-bold  my-8 subtitle text-center">
      ${next(node.content)}
  </h1>`,
      [BLOCKS.HEADING_4]: (
        node,
        next,
      ) => ` <h1 class="text-[2rem] font-bold my-8 subtitle">
      ${next(node.content)}
  </h1>`,
      [BLOCKS.PARAGRAPH]: (node, next) =>
        `<p class="text-md text-gray-400 my-2" >${next(node.content)}</p>`,
      [BLOCKS.LIST_ITEM]: (
        node,
        next,
      ) => `<li class="flex items-start justify-start text-[1rem] gap-4"> 
      <img src='/tick.png' class='w-[20px] h-[20px] mx-4'/>
      ${next(node.content)}
  </li>`,
    },
  })
}

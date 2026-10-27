export const ACCENTED = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ';
export const UNACCENTED = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN';
export const SEARCH_LANGUAGE = 'portuguese';

export const TICKET_SEARCH_VECTOR = `to_tsvector('${SEARCH_LANGUAGE}', translate("title" || ' ' || "description", '${ACCENTED}', '${UNACCENTED}'))`;

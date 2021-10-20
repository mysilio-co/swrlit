
// pulled this type from inrupt's tools: https://github.com/inrupt/solid-client-authn-js/blob/main/packages/browser/src/Session.ts#L265
type fetchFn = (url: RequestInfo, init?: RequestInit) => Promise<Response>

export const resourceExists = async (fetch: fetchFn, resourcePath: string) => {
  try {
    const result = await fetch(resourcePath, { method: 'HEAD' });
    return result.status === 403 || result.status === 200;

  } catch (e) {
    if (e.status === 404){
      return false
    } else {
      throw e
    }
  }
};

export const createDoc = async (fetch: fetchFn, documentUri: string, options: any) => {
    try {
        return await fetch(documentUri, options);
    } catch (e) {
        throw e;
    }
};

export const createDocument = async (fetch: fetchFn, documentUri: string, body = '') => {
    try {
        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/turtle'
            },
            body
        };
        return await createDoc(fetch, documentUri, options);
    } catch (e) {
        throw e;
    }
};

export const deleteFile = async (fetch: fetchFn, url: string) => {
    try {
        return await fetch(url, { method: 'DELETE' });
    } catch (e) {
        throw e;
    }
};

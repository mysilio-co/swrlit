import { fetcherFn } from '../contexts/authentication'

export const resourceExists = async (fetch: fetcherFn<any>, resourcePath: string) => {
    const result = await fetch(resourcePath, { method: 'HEAD' });
    return result.status === 403 || result.status === 200;
};

export const createDoc = async (fetch: fetcherFn<any>, documentUri: string, options: any) => {
    try {
        return await fetch(documentUri, options);
    } catch (e) {
        throw e;
    }
};

export const createDocument = async (fetch: fetcherFn<any>, documentUri: string, body = '') => {
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

export const deleteFile = async (fetch: fetcherFn<any>, url: string) => {
    try {
        return await fetch(url, { method: 'DELETE' });
    } catch (e) {
        throw e;
    }
};

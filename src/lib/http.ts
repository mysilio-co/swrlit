import auth from 'solid-auth-client';

export const resourceExists = async (resourcePath: string) => {
    const result = await auth.fetch(resourcePath, { method: 'HEAD' });
    return result.status === 403 || result.status === 200;
};

export const createDoc = async (documentUri: string, options: any) => {
    try {
        return await auth.fetch(documentUri, options);
    } catch (e) {
        throw e;
    }
};

export const createDocument = async (documentUri: string, body = '') => {
    try {
        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/turtle'
            },
            body
        };
        return await createDoc(documentUri, options);
    } catch (e) {
        throw e;
    }
};

export const deleteFile = async (url: string) => {
    try {
        return await auth.fetch(url, { method: 'DELETE' });
    } catch (e) {
        throw e;
    }
};

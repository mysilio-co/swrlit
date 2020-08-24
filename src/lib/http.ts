import { Session } from '@inrupt/solid-client-authn-browser'

export const resourceExists = async (auth: Session, resourcePath: string) => {
    const result = await auth.fetch(resourcePath, { method: 'HEAD' });
    return result.status === 403 || result.status === 200;
};

export const createDoc = async (auth: Session, documentUri: string, options: any) => {
    try {
        return await auth.fetch(documentUri, options);
    } catch (e) {
        throw e;
    }
};

export const createDocument = async (auth: Session, documentUri: string, body = '') => {
    try {
        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/turtle'
            },
            body
        };
        return await createDoc(auth, documentUri, options);
    } catch (e) {
        throw e;
    }
};

export const deleteFile = async (auth: Session, url: string) => {
    try {
        return await auth.fetch(url, { method: 'DELETE' });
    } catch (e) {
        throw e;
    }
};

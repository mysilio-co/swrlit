import { useCallback } from 'react';
import useSWRHook, { SWRHook } from 'swr';
import { WebId } from '@inrupt/solid-client/interfaces';
import {
  getPublicAccess,
  setPublicAccess,
  getAgentAccess,
  setAgentAccess,
} from '@inrupt/solid-client/universal';
import { SwrldResult, SwrlitKey } from './things';
import { useAuthentication } from '../contexts/authentication';
import {
  createAcl,
  createAclFromFallbackAcl,
  getFileWithAcl,
  hasResourceAcl,
  hasFallbackAcl,
  hasAccessibleAcl,
  saveAclFor,
} from '@inrupt/solid-client';
import { dequal } from 'dequal/lite';

// redefined from solid-client because it is not exported
// https://github.com/inrupt/solid-client-js/blob/main/src/acp/type/AccessModes.ts
export interface AccessModes {
  read: boolean;
  append: boolean;
  write: boolean;
  controlRead: boolean;
  controlWrite: boolean;
}

export type AccessResult = SwrldResult & {
  access: AccessModes;
  saveAccess: any;
  ensureAccess: any; // sets access to desired value if not set
  revokeAccess: any; // revoke all access
};
export type AllAccessResult = SwrldResult & {
  allAccess: Record<WebId, AccessModes>;
};

const useSWR: SWRHook = useSWRHook as any as SWRHook;

export const RevokedAccess = {
  read: false,
  append: false,
  write: false,
  controlRead: false,
  controlWrite: false,
};

export async function ensureAcl(resourceUrl: SwrlitKey, options: any) {
  if (resourceUrl) {
    const resourceWithAcl = await getFileWithAcl(resourceUrl, options);
    if (!hasAccessibleAcl(resourceWithAcl)) {
      throw new Error(
        'The current user does not have permission to change access rights to this Resource.'
      );
    }
    if (!hasResourceAcl(resourceWithAcl)) {
      let acl;
      if (hasFallbackAcl(resourceWithAcl)) {
        acl = createAclFromFallbackAcl(resourceWithAcl);
      } else {
        acl = createAcl(resourceWithAcl);
      }
      await saveAclFor(resourceWithAcl, acl, options);
    }
  } else {
    throw new Error('Cannot ensureAcl for undefined resource');
  }
}

export function usePublicAccess(resourceUrl: SwrlitKey): AccessResult {
  const { fetch } = useAuthentication();
  const fetcher = useCallback(
    async function (resourceUrl) {
      return getPublicAccess(resourceUrl, { fetch });
    },
    [resourceUrl, fetch]
  );
  const swr = useSWR([resourceUrl], fetcher) as AccessResult;
  const mutate = swr.mutate;
  const saveAccess = useCallback(
    async function (newAccess: AccessModes) {
      if (resourceUrl) {
        mutate(newAccess, false);
        await ensureAcl(resourceUrl, { fetch });
        const savedAccess = await setPublicAccess(resourceUrl, newAccess, {
          fetch,
        });
        mutate(savedAccess);
        return savedAccess;
      } else {
        throw new Error(
          `Could not update Public access for resource with url of ${resourceUrl}`
        );
      }
    },
    [swr, resourceUrl, fetch]
  );
  swr.saveAccess = resourceUrl && saveAccess;
  swr.access = swr.data;
  const ensureAccess = useCallback(
    async function (toEnsure: AccessModes) {
      console.log(`Ensuring ${swr.access} is ${toEnsure}`);
      if (swr.access && !dequal(swr.access, toEnsure)) {
        console.log(`Updating access to ${toEnsure}`);
        await swr.saveAccess(toEnsure);
      } else {
        console.log(`Access already matches ${toEnsure}`);
      }
      return toEnsure;
    },
    [swr.access]
  );
  const revokeAccess = useCallback(
    async function () {
      return await ensureAccess(RevokedAccess);
    },
    [swr.access]
  );
  swr.ensureAccess = ensureAccess;
  swr.revokeAccess = revokeAccess;
  return swr;
}

export function useAgentAccess(
  resourceUrl: SwrlitKey,
  webId: WebId
): AccessResult {
  const { fetch } = useAuthentication();
  const fetcher = useCallback(
    async function (resourceUrl, webId) {
      return getAgentAccess(resourceUrl, webId, { fetch });
    },
    [resourceUrl, webId, fetch]
  );
  const swr = useSWR([resourceUrl, webId], fetcher) as AccessResult;
  const mutate = swr.mutate;
  const saveAccess = useCallback(
    async function (newAccess: AccessModes) {
      if (resourceUrl) {
        mutate(newAccess, false);
        await ensureAcl(resourceUrl, { fetch });
        const savedAccess = await setAgentAccess(
          resourceUrl,
          webId,
          newAccess,
          { fetch }
        );
        mutate(savedAccess);
        return savedAccess;
      } else {
        throw new Error(
          `Could not update Agent access for resource with url of ${resourceUrl} for ${webId}`
        );
      }
    },
    [swr, resourceUrl, webId, fetch]
  );
  swr.saveAccess = resourceUrl && saveAccess;
  swr.access = swr.data;
  const ensureAccess = useCallback(
    async function (toEnsure: AccessModes) {
      if (swr.access !== toEnsure) {
        await swr.saveAccess(toEnsure);
      }
      return toEnsure;
    },
    [swr]
  );
  const revokeAccess = useCallback(
    async function () {
      return await ensureAccess(RevokedAccess);
    },
    [swr]
  );
  swr.ensureAccess = ensureAccess;
  swr.revokeAccess = revokeAccess;
  return swr;
}

import { useCallback } from 'react';
import useSWRHook, { SWRHook } from 'swr';
import { WebId } from '@inrupt/solid-client/interfaces';
import * as access from '@inrupt/solid-client/access/universal';
import { SwrldResult, SwrlitKey } from './things';
import { useAuthentication } from '../contexts/authentication';

export type AccessResult = SwrldResult & {
  access: access.Access;
  saveAccess: any;
};
export type AllAccessResult = SwrldResult & {
  allAccess: Record<WebId, access.Access>;
};

const useSWR: SWRHook = (useSWRHook as any) as SWRHook

// TODO use access.Actor once https://github.com/inrupt/solid-client-js/pull/1519 is released
export type Actor = 'agent' | 'group' | 'public';
export const GroupActor = 'group';
export const AgentActor = 'agent';
export const PublicActor = 'public';

export function usePublicAccess(resourceUrl: SwrlitKey): AccessResult {
  return useAccessFor(resourceUrl, PublicActor);
}

export function useAgentAccess(
  resourceUrl: SwrlitKey,
  webId: SwrlitKey
): AccessResult {
  return useAccessFor(resourceUrl, AgentActor, webId);
}

export function useAgentAccessAll(
  resourceUrl: SwrlitKey,
): AllAccessResult {
  return useAccessForAll(resourceUrl, AgentActor);
}

export function useGroupAccess(
  resourceUrl: SwrlitKey,
  groupId: SwrlitKey
): AccessResult {
  return useAccessFor(resourceUrl, GroupActor, groupId);
}

export function useGroupAccessAll(
  resourceUrl: SwrlitKey,
): AllAccessResult {
  return useAccessForAll(resourceUrl, GroupActor);
}

export function useAccessForAll(
  resourceUrl: SwrlitKey,
  actorType: Actor,
): AllAccessResult {
  const { fetch } = useAuthentication();
  const fetcher = useCallback(
    (resourceUrl: string, actorType: Actor) => {
      if (actorType == PublicActor) {
        throw new Error("useAccessForAll not supported for 'public' actor. Try useAccessFor instead.")
      } else {
        return access.getAccessForAll(resourceUrl, actorType, { fetch });
      }
    },
    [resourceUrl, actorType, fetch]
  );
  const swr = useSWR([resourceUrl, actorType], fetcher) as AllAccessResult;
  swr.allAccess = swr.data;
  return swr;
};

export function useAccessFor(
  resourceUrl: SwrlitKey,
  actorType: Actor,
  actor?: SwrlitKey
): AccessResult {
  const { fetch } = useAuthentication();
  const fetcher = useCallback(
    (resourceUrl: string, actorType: Actor, actor: string) => {
      if (actorType == PublicActor) {
        return access.getAccessFor(resourceUrl, actorType, { fetch });
      } else {
        return access.getAccessFor(resourceUrl, actorType, actor, { fetch });
      }
    },
    [resourceUrl, actorType, actor, fetch]
  );
  const swr = useSWR([resourceUrl, actorType, actor], fetcher) as AccessResult;
  const mutate = swr.mutate;
  const saveAccess = useCallback(
    async function (newAccess: access.Access) {
      if (resourceUrl && actorType == PublicActor) {
        mutate(newAccess, false);
        const savedAccess = await access.setAccessFor(
          resourceUrl,
          actorType,
          newAccess,
          { fetch }
        );
        mutate(savedAccess);
        return savedAccess;
      } else if (resourceUrl && actor) {
        mutate(newAccess, false);
        const savedAccess = await access.setAccessFor(
          resourceUrl,
          actorType,
          newAccess,
          actor,
          { fetch }
        );
        mutate(savedAccess);
        return savedAccess;
      } else {
        throw new Error(
          `Could not update ${actorType} access for resource with url of ${resourceUrl} for actor ${actor}`
        );
      }
    },
    [resourceUrl, fetch]
  );
  swr.saveAccess = resourceUrl && saveAccess;
  swr.access = swr.data;
  return swr;
}

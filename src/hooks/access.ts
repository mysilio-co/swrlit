import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetcher, SwrldResult } from './things';
import { UrlString, WebId, access } from '@inrupt/solid-client';
import { useAuthentication } from '../contexts/authentication';

export type AccessResult = SwrldResult & { access: access.Access; saveAccess: any };
export type AllAccessResult = SwrldResult & {
  allAccess: Record<WebId, access.Access>;
};

// TODO use access.Actor once https://github.com/inrupt/solid-client-js/pull/1519 is released
export type Actor = 'agent' | 'group' | 'public';
export const GroupActor = 'group';
export const AgentActor = 'agent';
export const PublicActor = 'public';

export function usePublicAccess(resourceUrl: UrlString): AccessResult {
  return useAccessFor(resourceUrl, PublicActor);
}

export function useAgentAccess(
  resourceUrl: UrlString,
  webId: WebId
): AccessResult {
  return useAccessFor(resourceUrl, AgentActor, webId);
}

export function useAgentAccessAll(
  resourceUrl: UrlString,
  webId: WebId
): AllAccessResult {
  return useAccessForAll(resourceUrl, AgentActor, webId);
}

export function useGroupAccess(
  resourceUrl: UrlString,
  groupId: WebId
): AccessResult {
  return useAccessFor(resourceUrl, GroupActor, groupId);
}

export function useGroupAccessAll(
  resourceUrl: UrlString,
  groupId: WebId
): AllAccessResult {
  return useAccessForAll(resourceUrl, GroupActor, groupId);
}

export function useAccessForAll(
  resourceUrl: UrlString,
  actorType: Actor,
  actor?: WebId
): AllAccessResult {
  const { fetch } = useAuthentication();
  const swr = useSWR(
    [resourceUrl, actorType, actor, { fetch }],
    access.getAccessForAll
  ) as AllAccessResult;
  swr.allAccess = swr.data;
  return swr;
};

export function useAccessFor(
  resourceUrl: UrlString,
  actorType: Actor,
  actor?: WebId
): AccessResult {
  const { fetch } = useAuthentication();
  const swr = useSWR(
    [resourceUrl, actorType, actor, { fetch }],
    access.getAccessFor
  ) as AccessResult;
  const mutate = swr.mutate;
  const saveAccess = useCallback(
    async function (newAccess: access.Access) {
      if (resourceUrl) {
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
          `Could not update access for resource with url of ${resourceUrl}`
        );
      }
    },
    [resourceUrl, fetch]
  );
  swr.saveAccess = resourceUrl && saveAccess;
  swr.access = swr.data;
  return swr;
}
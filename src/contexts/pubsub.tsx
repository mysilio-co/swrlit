import React, { createContext, useContext, useCallback, useState } from 'react'
import { mutate } from 'swr'


type PubSub = {
  sub: (uri: string) => void
}
const PubSubContext = createContext<PubSub>({
  sub: () => {
    console.log("cannot find UpdateProvider, did you add one to your app?")
  }
})

const { Provider } = PubSubContext

function newWebSocketFromURL(url: URL): WebSocket {
  const { protocol, host } = url
  const socketUrl = `${protocol.replace('http', 'ws')}//${host}/`;
  const webSocket = new WebSocket(socketUrl);
  webSocket.onmessage = function onMessage({ data }) {
    const match = /^pub +(.+)/.exec(data);
    if (match) {
      const url = match[1];
      mutate(url)
    }
  }
  return webSocket
}

export function PubSubProvider(props: any) {
  const [webSockets, setWebsockets] = useState<{ [key: string]: WebSocket }>({})
  const [messages, setMessages] = useState<{ [key: string]: string[] }>({})

  const getOrCreateWebsocket = useCallback(function getOrCreateWebsocket(uri: string) {
    const url = new URL(uri)
    const { host } = url;
    const webSocket = webSockets[host]
    if (webSocket) {
      return webSocket
    } else {
      const newWebSocket = newWebSocketFromURL(url)
      newWebSocket.onopen = function onWebsocketOpen() {
        if (messages[uri]) {
          for (const msg of messages[uri]) {
            this.send(msg)
          }
          messages[uri] = []
          setMessages(messages)
        }
      }
      webSockets[host] = newWebSocket
      setWebsockets(webSockets)
      return newWebSocket
    }
  }, [webSockets, messages])

  const sub = useCallback(function sub(uri: string) {
    const webSocket = getOrCreateWebsocket(uri)
    const msg = `sub ${uri}`
    if (webSocket && (webSocket.readyState === WebSocket.OPEN)) {
      webSocket.send(msg)
    } else {
      messages[uri] = messages[uri] ? [...messages[uri], msg] : [msg]
      setMessages(messages)
    }
  }, [messages])

  const value = ({
    sub
  })
  return (
    <Provider value={value}  {...props} />
  )
}

export const usePubSub = () => useContext(PubSubContext)

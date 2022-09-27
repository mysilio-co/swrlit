# swrlit

swirl the web in your cup

## what's this?

`swrlit` combines the power of [`useSWR`](https://swr.vercel.app/)
with magic of Inrupt's [~~`lit-pod`~~`solid-client`](https://github.com/inrupt/solid-client-js) to create
the swirliest [Solid](https://solidproject.org) data access library
out there

## how do I use it?

see the examples below or [read the docs](https://swrlit.mysilio.page/)

you can get support by filing an issue

## install in an existing project

``` sh
npm install swrlit
```

### get data from a pod

``` typescript
import { useThing } from "swrlit"
import {
  getUrlAll, getUrl, getStringNoLocale
} from '@inrupt/solid-client'
import { vcard, foaf } from 'rdf-namespaces'

function Profile({webId}){
  const { thing: profile } = useThing(webId)
  const profileImage = profile && getUrl(profile, vcard.hasPhoto)
  const name = profile && getStringNoLocale(profile, foaf.name)
  return (
  <div>
    <h1>{name}</h1>
    <img src={profileImage} alt={name}/>
  </div>
  )
}
```

### create data in a pod


``` typescript
import { useWebId, useContainer, useProfile, useEnsured, AuthenticationProvider } from "swrlit"
import {
  createThing, setThing, addUrl, setStringNoLocale,
  saveSolidDatasetInContainer, createSolidDataset
} from '@itme/solid-client'
import { WS } from '@inrupt/vocab-solid-common'

export function useStorageContainer(webId) {
  const { profile } = useProfile(webId)
  return profile && getUrl(profile, WS.storage)
}

export function useTimelogContainerUri(webId, path = 'public') {
  const storageContainer = useStorageContainer(webId)
  return useEnsured(storageContainer && `${storageContainer}${path}/timelogs/`)
}

function TimeLogCreator(){
  const myWebId = useWebId()
  const timelogContainerUri = useTimelogContainerUri(myWebId, 'private')
  const { resources: timelogs, mutate: mutateTimelogs } = useContainer(timelogContainerUri)

  const createTimelog = async ({ name = "Time Tracker"}) => {
    var log = createThing({ name: 'log' });
    log = addUrl(log, RDF.type, TIMELOG.Log)
    log = setStringNoLocale(log, RDFS.label, name)

    var dataset = createSolidDataset()
    dataset = setThing(dataset, log)

    await saveSolidDatasetInContainer(timelogContainerUri, dataset, { slugSuggestion: name })
    mutateTimelogs()
  }

  return (
    <div>
      <button onClick={createTimelog}>Create Timelog</button>
    </div>
  )
}

function App(){
  return (
    <AuthenticationProvider>
      <TimeLogCreator/>
    </AuthenticationProvider>
  )
}
```

See

https://github.com/itme/swrlit-example

https://github.com/itme/swrlit-timetracker

for functioning examples.

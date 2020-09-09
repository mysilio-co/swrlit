# swrlit

swirl the web in your cup

## what's this?

`swrlit` combines the power of [`useSWR`](https://swr.vercel.app/)
with magic of Inrupt's [~~`lit-pod`~~`solid-client`](https://github.com/inrupt/solid-client-js) to create
the swirliest [Solid](https://solidproject.org) data access library
out there

## install

``` sh
npm install swrlit
```

## examples

``` typescript
import { useThing } from "swrlit"
import {
  getUrlAll, getUrl, getStringNoLocale
} from '@itme/solid-client'
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

``` typescript
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
```

See

https://github.com/itme/swrlit-example

https://github.com/itme/swrlit-timetracker

for functioning examples.

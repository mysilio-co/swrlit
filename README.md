# swrlit

swirl the web in your glass

## what's this?

`swrlit` combines the power of [`useSWR`](https://swr.vercel.app/)
with magic of [`lit-pod`](https://inrupt.github.io/lit-pod/) to create
the most elegant [Solid](https://solidproject.org) data access library
out there

## install

``` sh
npm install swrlit
```

## examples

``` typescript
import { useThing } from "swrlit"
import {
  getUrlAll, getUrlOne, getStringNoLocaleOne
} from '@solid/lit-pod'

function Profile({webId)){
  const { thing: profile } = useThing(webId)
  const profileImage = profile && getUrlOne(profile, vcard.hasPhoto)
  const name = profile && getStringNoLocaleOne(profile, foaf.name)
  return (
  <div>
    <h1>{name}</h1>
    <img src={profileImage} alt={name}/>
  </div>
  )
}
```

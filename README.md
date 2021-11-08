# Berth reservations' federated GraphQL gateway

:link: Apollo-federation gateway for berth-reservations service :boat: :id:

## Overview

[Apollo-federation](https://www.apollographql.com/docs/apollo-server/federation/introduction/) is
a gateway proxy that enables combining multiple sources of data into a single GraphQL API.
with it, you can split your data between different APIs, as long as they have a common
unique field that can be used as key to identify them by.

This specific gateway combines two projects:
1. [open-city-profile](https://github.com/City-of-Helsinki/open-city-profile)
2. [berth-reservations](https://github.com/City-of-Helsinki/berth-reservations)

## Set up w/ Docker

0. You need to have the two projects mentioned above running somewhere (locally,
    staging or production).

1. Create `docker-compose.env.yaml` in the root of the project, for example using
    the template file:
    * `cp docker-compose.env.yaml.example docker-compose.env.yaml`

2. Put proper links to GraphQL APIs for open-city-profile and berth-reservations.
    * current placeholder in the template will work if you use default docker-compose
      setups for each project
    * you can use the test instances managed by the City of Helsinki:
        - https://profile-api.test.hel.ninja/graphql/ for profile
        - https://venepaikka-api.test.kuva.hel.ninja/graphql/ for berths

3. Adjust other variables according to your needs.

4. Run `docker-compose up`

The project is now running at [localhost:3000](http://localhost:3000) (or at the
PORT you specified in the `docker-compose.env.yaml`)

## Environments

Test environment: https://venepaikka-federation.test.kuva.hel.ninja/

Voyager graph of all Queries: https://venepaikka-federation.test.kuva.hel.ninja/voyager

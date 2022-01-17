# URL Shortener

A highly scalable URL shortener built for CS559 (System Design) Course project at IIT Bhilai. 

## Links
- [Design Doc](https://probable-manta-37a.notion.site/URL-Shortener-204bf8f4a567422abd27accadcf9510e)
- [API Documentation](https://gas-url-shortener.herokuapp.com/docs/)

## Features
- Generates unique and short URLs for the provided urls.
- Users can specify the time of expiry for the short links.
- Users can analyse and measure the traffic. (Coming soon)

## Usage
- Install [pnpm](https://pnpm.io/) and run `pnpm i`
- While developing use `pnpm dev`
- While deploying use `pnpm start`
- While testing use `pnpm test`. This will run load tests using [k6](https://k6.io/) to the measure the server's capacity. Note: This will use Docker to run tests.

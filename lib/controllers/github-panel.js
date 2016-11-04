/** @babel */

// TODO: Delete **AND INVALIDATE** me
const token = "a5329ff96539fda38a99068923b28b1d25ec0a3c"

import React from 'react'
import ReactDOM from 'react-dom'
import Relay from 'react-relay'

Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('https://api.github.com/graphql', {
    headers: {
      Authorization: `bearer ${token}`
    },
  })
);

import PrInfo from '../views/pr-info'

class IndexRoute extends Relay.Route {
  static routeName = 'Index'

  static queries = {
    repository: () => Relay.QL`
      query { relay }
    `
  }
}

export default class GithubPanel {
  constructor () {
    this.element = document.createElement('div')
    this.element.classList.add('github-panel-gh-info-container')
    // const networkInterface = createNetworkInterface({
    //   uri: 'http://api.github.com/graphql'
    // })
    // networkInterface.use([{
    //   applyMiddleware (req, next) {
    //     if (!req.options.headers) {
    //       req.options.headers = {}
    //     }
    //
    //     req.options.headers.authorization = `bearer ${token}`
    //     next()
    //   }
    // }])
    // this.client = new ApolloClient({ networkInterface })

    const route = new IndexRoute()

    ReactDOM.render(
      <Relay.RootContainer
        Component={PrInfo}
        route={route}
      />,
      this.element
    )
  }

  dispose () {
    ReactDOM.unmountComponentAtNode(this.element)
  }
}

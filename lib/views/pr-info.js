/** @babel */

import React from 'react'
import Relay from 'react-relay'

// import RepoInfo from './repo-info'

class PrInfo extends React.Component {
  render () {
    console.trace('here')
    console.log('props', this.props)

    return (
      <div style={{padding: 20}}>
        <h4>Data from Relay:</h4>
        <div>Name: {this.props.repository.repository.name}</div>
        <div>Description: {this.props.repository.repository.description}</div>
      </div>
    )
  }
}

export default Relay.createContainer(PrInfo, {
  fragments: {
    repository: () => Relay.QL`
      fragment on Query {
        repository(owner: "BinaryMuse" name: "fluxxor") {
          name description
        }
      }
    `
  }
})

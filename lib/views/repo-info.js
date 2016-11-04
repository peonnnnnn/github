/** @babel */

import { createFragment } from 'apollo-client'
import React from 'react'
import gql from 'graphql-tag'

export default class Repo extends React.Component {
  render () {
    return (
      <div>{this.props.repo.name}: {this.props.repo.description}</div>
    )
  }

  static fragments = {
    repo: createFragment(gql`
      fragment repo on Repository {
        name description
      }
    `)
  }
}

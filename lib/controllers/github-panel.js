/** @babel */

import React from 'react'
import { Adrenaline, container, presenter } from 'adrenaline'

import ghNetworkLayer from '../gh-gql-network-layer'

const gqlEndpoint = "https://api.github.com/graphql"

export default class GithubPanel extends React.Component {
  render () {
    return (
      <Adrenaline endpoint={gqlEndpoint} networkLayer={ghNetworkLayer}>
        <PRInfo owner="atom" repo="tree-view" />
      </Adrenaline>
    )
  }
}

class PrTimelineBase extends React.Component {
  render () {
    console.log("timeline", this.props)
    return (
      <ul>
        {this.props.events.map(this.renderEvent.bind(this))}
      </ul>
    )
  }

  renderEvent (event, i) {
    switch (event.__typename) {
      case "Commit":
        return this.renderCommit(event, i)
      case "IssueComment":
        return this.renderComment(event, i)
      default:
        return <span key={i}>{event.__typename}</span>
    }
  }

  renderCommit (commit, i) {
    return (
      <li key={i}>
        {commit.oid.substr(0, 7)}: {commit.message}
      </li>
    )
  }

  renderComment (comment, i) {
    return (
      <li key={i}>
        <div>
          <img src={comment.author.avatarURL} />
          <strong>{comment.author.login}</strong>
        </div>
        <div dangerouslySetInnerHTML={{__html: comment.bodyHTML}} />
      </li>
    )
  }
}

const PrTimeline = presenter({
  fragments: {
    pr: `
    fragment on PullRequest {
      timeline(first: 30) {
        edges {
          node {
            __typename

            ... on Commit {
              message messageBodyHTML oid author {
                name email user { login }
              }
            }

            ... on IssueComment {
              bodyHTML author {
                login avatarURL(size:20)
              }
            }
          }
        }
      }
    }
    `
  }
})(PrTimelineBase)

class PullRequestBase extends React.Component {
  render () {
    const pr = this.props.pr

    return (
      <div>
        <div className='pr-header'>
          <h3 className='pr-title'>{pr.title}</h3>
          <span className='pr-number'>#{pr.number}</span>
        </div>
        <div className='pr-author'>
          <img className='avatar' src={this.avatarUrl(pr.author.login)} />
          <strong>@{pr.author.login}</strong>
        </div>
        <div className='pr-body-html' dangerouslySetInnerHTML={{__html: pr.bodyHTML}} />
        <PrTimeline events={pr.timeline.edges.map(e => e.node)} />
      </div>
    )
  }

  avatarUrl (login) {
    return `https://github.com/${login}.png`
  }
}

const PullRequest = presenter({
  fragments: {
    pr: `
      fragment on PullRequest {
        number title author { name login }
        bodyHTML

        ${PrTimeline.getFragment('pr')}
      }
    `
  }
})(PullRequestBase)


class RepositoryInfoBase extends React.Component {
  render () {
    console.log(this.props);
    return (
      <div>
        {this.props.repository.pullRequests.edges.map((edge, i) => {
          return <PullRequest key={i} pr={edge.node} />
        })}
      </div>
    )
  }
}

const RepositoryInfo = presenter({
  fragments: {
    repo: `
      fragment on Repository {
        pullRequests(states:[CLOSED], last:1) {
          edges {
            node {
              ${PullRequest.getFragment('pr')}
            }
          }
          totalCount
        }
      }
    `
  }
})(RepositoryInfoBase)

class PRInfoBase extends React.Component {
  render () {
    console.log('p', this.props)

    if (this.props.isFetching) {
      return <div className='github-panel-gh-info'>Loading...</div>
    }

    return (
      <div className='github-panel-gh-info'>
        <RepositoryInfo repository={this.props.repositoryOwner.repository} />
      </div>
    )
  }
}

const PRInfo = container({
  variables: (props) => ({
    owner: props.owner,
    repo: props.repo
  }),
  query: `
    query ($owner: String!, $repo: String!) {
      repositoryOwner(login: $owner) {
        repository(name: $repo) {
          ${RepositoryInfo.getFragment('repo')}
        }
      }
    }
  `
})(PRInfoBase)

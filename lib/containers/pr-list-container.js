import React from 'react';
import Relay from 'react-relay';

import PrInfoContainer from './pr-info-container';

export class PrList extends React.Component {
  static propTypes = {
    relay: React.PropTypes.object.isRequired,
    query: React.PropTypes.shape({
      repository: React.PropTypes.object,
    }),
  }

  render() {
    // TODO: render a selector if multiple PRs
    const repo = this.props.query.repository;
    if (!repo) {
      return this.renderNoRepoFound();
    }

    if (!repo.pullRequests.edges.length) {
      return this.renderNoPullsFound();
    }

    const pr = repo.pullRequests.edges[0].node;
    return (
      <PrInfoContainer repository={repo} pullRequest={pr} />
    );
  }

  renderNoRepoFound() {
    const {relay} = this.props;
    return (
      <div>
        The repository {relay.variables.repoOwner}/{relay.variables.repoName} was not found.
      </div>
    );
  }

  renderNoPullsFound() {
    const {relay} = this.props;
    return (
      <div>
        No pull requests were found for the {relay.variables.branchName} branch
        using {relay.variables.repoOwner}/{relay.variables.repoName} as a base.
      </div>
    );
  }
}

export default Relay.createContainer(PrList, {
  initialVariables: {
    repoOwner: null,
    repoName: null,
    branchName: null,
  },

  fragments: {
    query: () => Relay.QL`
      fragment on Query {
        repository(owner: $repoOwner, name: $repoName) {
          ${PrInfoContainer.getFragment('repository')}
          pullRequests(first: 30, headRefName: $branchName) {
            edges {
              node {
                ${PrInfoContainer.getFragment('pullRequest')}
              }
            }
          }
        }
      }
    `,
  },
});

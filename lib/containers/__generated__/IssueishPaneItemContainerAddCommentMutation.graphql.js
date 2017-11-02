/**
 * @flow
 * @relayHash 50f5004bc9b8e058d71c53a7094154b7
 */

/* eslint-disable */

'use strict';

/*::
import type {ConcreteBatch} from 'relay-runtime';
export type IssueishPaneItemContainerAddCommentMutationVariables = {|
  input: {
    clientMutationId?: ?string;
    subjectId: string;
    body: string;
  };
|};

export type IssueishPaneItemContainerAddCommentMutationResponse = {|
  +addComment: ?{|
    +commentEdge: {|
      +node: ?{| |};
    |};
  |};
|};
*/


/*
mutation IssueishPaneItemContainerAddCommentMutation(
  $input: AddCommentInput!
) {
  addComment(input: $input) {
    commentEdge {
      node {
        ...IssueCommentContainer_item
        id
      }
    }
  }
}

fragment IssueCommentContainer_item on IssueComment {
  author {
    __typename
    avatarUrl
    login
    ... on Node {
      id
    }
  }
  bodyHTML
  createdAt
}
*/

const batch /*: ConcreteBatch*/ = {
  "fragment": {
    "argumentDefinitions": [
      {
        "kind": "LocalArgument",
        "name": "input",
        "type": "AddCommentInput!",
        "defaultValue": null
      }
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "IssueishPaneItemContainerAddCommentMutation",
    "selections": [
      {
        "kind": "LinkedField",
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "input",
            "variableName": "input",
            "type": "AddCommentInput!"
          }
        ],
        "concreteType": "AddCommentPayload",
        "name": "addComment",
        "plural": false,
        "selections": [
          {
            "kind": "LinkedField",
            "alias": null,
            "args": null,
            "concreteType": "IssueCommentEdge",
            "name": "commentEdge",
            "plural": false,
            "selections": [
              {
                "kind": "LinkedField",
                "alias": null,
                "args": null,
                "concreteType": "IssueComment",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "kind": "FragmentSpread",
                    "name": "IssueCommentContainer_item",
                    "args": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Mutation"
  },
  "id": null,
  "kind": "Batch",
  "metadata": {},
  "name": "IssueishPaneItemContainerAddCommentMutation",
  "query": {
    "argumentDefinitions": [
      {
        "kind": "LocalArgument",
        "name": "input",
        "type": "AddCommentInput!",
        "defaultValue": null
      }
    ],
    "kind": "Root",
    "name": "IssueishPaneItemContainerAddCommentMutation",
    "operation": "mutation",
    "selections": [
      {
        "kind": "LinkedField",
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "input",
            "variableName": "input",
            "type": "AddCommentInput!"
          }
        ],
        "concreteType": "AddCommentPayload",
        "name": "addComment",
        "plural": false,
        "selections": [
          {
            "kind": "LinkedField",
            "alias": null,
            "args": null,
            "concreteType": "IssueCommentEdge",
            "name": "commentEdge",
            "plural": false,
            "selections": [
              {
                "kind": "LinkedField",
                "alias": null,
                "args": null,
                "concreteType": "IssueComment",
                "name": "node",
                "plural": false,
                "selections": [
                  {
                    "kind": "LinkedField",
                    "alias": null,
                    "args": null,
                    "concreteType": null,
                    "name": "author",
                    "plural": false,
                    "selections": [
                      {
                        "kind": "ScalarField",
                        "alias": null,
                        "args": null,
                        "name": "__typename",
                        "storageKey": null
                      },
                      {
                        "kind": "ScalarField",
                        "alias": null,
                        "args": null,
                        "name": "avatarUrl",
                        "storageKey": null
                      },
                      {
                        "kind": "ScalarField",
                        "alias": null,
                        "args": null,
                        "name": "login",
                        "storageKey": null
                      },
                      {
                        "kind": "ScalarField",
                        "alias": null,
                        "args": null,
                        "name": "id",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "kind": "ScalarField",
                    "alias": null,
                    "args": null,
                    "name": "bodyHTML",
                    "storageKey": null
                  },
                  {
                    "kind": "ScalarField",
                    "alias": null,
                    "args": null,
                    "name": "createdAt",
                    "storageKey": null
                  },
                  {
                    "kind": "ScalarField",
                    "alias": null,
                    "args": null,
                    "name": "id",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "text": "mutation IssueishPaneItemContainerAddCommentMutation(\n  $input: AddCommentInput!\n) {\n  addComment(input: $input) {\n    commentEdge {\n      node {\n        ...IssueCommentContainer_item\n        id\n      }\n    }\n  }\n}\n\nfragment IssueCommentContainer_item on IssueComment {\n  author {\n    __typename\n    avatarUrl\n    login\n    ... on Node {\n      id\n    }\n  }\n  bodyHTML\n  createdAt\n}\n"
};

module.exports = batch;

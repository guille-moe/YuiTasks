"use strict";
const http = require("request");
const URL = require('url');

const TRELLO_URL = "https://api.trello.com/1/";

module.exports = function(context, cb) {
  if (context && cb) {
    return new Pr2Trello(context, cb).run(); // WebTask mode
  } else {
    return Pr2Trello; // Test mode
  }
};

class Pr2Trello {
  constructor(context, cb) {
    this.data      = context.body;
    this.secret    = context.data;
    this.respond   = cb;
    this.listCount = 0;
    this.cardIds   = [];
    this.errors    = [];
  }

  run() {
    if (this.needToClose()) {
      this.getListId();
    } else {
      this.nack("PR not supposed to move");
    }
  }

  getListId() {
    if (this.secret.trello_list) {
      this.getCards();
    } else if (!this.secret.trello_list && this.secret.trello_list_name) {
      http.get(this.getListOptions(), (error, response, body) => this.findList(error, response, body));
    } else {
      this.nack("invalid Trello List id");
    }
  }

  findList(error, response, body) {
    if(!error) {
      const lists = JSON.parse(body);
      this.secret.trello_list = (lists.find((list) => {
        return this.secret.trello_list_name.trim() == list.name.trim();
      }) || {}).id;
      if (!!this.secret.trello_list) {
        this.getCards();
      } else {
        this.nack("trello api no list found in: body");
      }
    } else {
      this.nack(`trello api error on list lookup: \n${error}`);
    }
  }

  getCards() {
    if (typeof(this.secret.trello_search_list) == "string") {
      this.secret.trello_search_list = [ this.secret.trello_search_list ];
    }
    this.secret.trello_search_list.forEach((id) => {
      http.get(this.getCardsOptions(id), (error, response, body) => this.procCards(error, response, body));
    });
  }

  procCards(error, response, body) {
    if (!error) {
      this.cardIds.push(...this.cardsToMove(JSON.parse(body)));
    } else {
      this.nack(`trello api error on cards search: \n${error}`);
    }
    this.listCount += 1
    if (this.listCount == this.secret.trello_search_list.length) {
      if (this.cardIds.length > 0) {
        for(let cardId of this.cardIds) {
            this.moveCard(cardId);
        }
      } else {
        this.nack("trello api no cards found");
      }
    }
  }

  moveCard(cardId) {
    http.put(this.moveCardOptions(cardId), () => { this.globalAck(cardId) });
  }

  globalAck(cardId) {
    this.cardIds = this.cardIds.filter((id) => { return id != cardId; });
    if (this.cardIds.length == 0) {
      this.ack(true);
    }
  }

  /********#######+++++++=======~~~~~~------~~~~~~=======+++++++#######*******/

  needToClose() {
    return (this.hasMinimalDataStruct() && this.isMergedPR() && this.isPRValidOwner() && this.hasTrelloInfo());
  }

  hasMinimalDataStruct() {
    return !!this.data && !!this.data.action && !!this.data.pull_request;
  }

  isMergedPR() {
    return this.data.action == "closed" && !!this.data.pull_request.merged;
  }

  isPRValidOwner() {
    return !this.secret.user || this.data.pull_request.user.login == this.secret.user;
  }

  hasTrelloInfo() {
    return !!this.secret.trello_key && !!this.secret.trello_token && !!this.secret.trello_board && !!this.secret.trello_search_list;
  }

  needToMove(card) {
    const index = card.attachments.findIndex((attachment) => {
      return attachment.url == this.data.pull_request.html_url;
    });
    return index > -1;
  }

  cardsToMove(data) {
    return data.reduce((arr, card) => {
      if (this.needToMove(card)) {
        arr.push(card.id);
      }
      return arr;
    }, []);
  }

  getListOptions() {
    return {
      url: `${TRELLO_URL}boards/${this.secret.trello_board}/lists${this.authParams()}`,
      qs: { fields: 'id,name' }
    };
  }

  getCardsOptions(id) {
    return {
      url: `${TRELLO_URL}lists/${id}/cards${this.authParams()}`,
      qs: {
        attachments: "true",
        fiels: "attachments"
      }
    };
  }

  moveCardOptions(cardId) {
    return {
      url: `${TRELLO_URL}cards/${cardId}${this.authParams()}`,
      qs: { idList: this.secret.trello_list }
    };
  }

  authParams() {
    return `?key=${this.secret.trello_key}&token=${this.secret.trello_token}`;
  }

  ack(val) {
    this.respond(null, {ack: val});
  }

  nack(val) {
    this.respond(null, {nack: val});
  }
}

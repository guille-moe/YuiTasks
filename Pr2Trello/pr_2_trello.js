"use strict";
const http = require('request@2.81.0');

module.exports = function(context, cb) {
  new Pr2Trello(context, cb).run();
};

class Pr2Trello {
  constructor(context, cb) {
    this.data     = context.data;
    this.secret   = context.secret;
    this.respond  = cb;
    this.card_ids = [];
  }

  run() {
    if (this.needToClose()) {
      this.getCards();
    }
  }

  getCards() {
    http(this.getCardsOptions(), this.procCards);
  }

  procCards(error, response, body) {
    if (error) {
      throw new Error(error);
    }
    this.card_ids = this.cardsToMove(JSON.parse(body));
    if (this.card_ids.length > 0) {
      for(let card_id of this.card_ids) {
        this.moveCard(card_id);
      }
    }
  }

  moveCard(card_id) {
    http(this.moveCardOptions(card_id), () => { this.globalAck(card_id) });
  }

  globalAck(card_id) {
    this.card_ids = this.card_id.filter((id) => { return id != card_id; });
    if (this.card_ids.length == 0) {
      this.callback(null, { ok: "ack" })
    }
  }

  /********#######+++++++=======~~~~~~------~~~~~~=======+++++++#######*******/

  needToClose() {
    return this.isValidContext() && this.isMergedPR() && this.isPRValidOwner() && this.hasTrelloInfo();
  }

  isValidContext() {
    return !!this.data && !!this.data.action;
  }

  isMergedPR() {
    return this.data.action == "closed" && !!this.data.pull_request.merged;
  }

  isPRValidOwner() {
    return this.data.pull_request.user.login == this.secret.user;
  }

  hasTrelloInfo() {
    return !!this.secret.trello_key && !!this.secret.trello_token && !!this.secret.trello_board && !!this.secret.trello_list;
  }

  needToMove(card) {
    return card.idList != this.secret.trello_list;
  }

  cardsToMove(data) {
    return data.cards.reduce((arr, card) => {
      if (this.needToMovethis(data)) {
        arr.push(card.id);
        return arr;
      }
    }, []);
  }

  getCardsOptions() {
    return {
      method: 'GET',
      url: `https://api.trello.com/1/search${this.authParams()}`,
      qs: {
        query: this.data.pull_request.html_url,
        idBoards: this.secret.trello_board,
        modelTypes: 'cards',
        card_attachments: 'true',
        partial: 'false'
      }
    };
  }

  moveCardOptions(card_id) {
    return {
      method: 'PUT',
      url: `https://api.trello.com/1/cards/${card_id}${this.authParams()}`,
      qs: { idList: this.secret.trello_list }
    };
  }

  authParams() {
    return `?key=${this.trello_key}&token=${this.trello_token}`;
  }
}

"use strict";
const nodemailer = require("nodemailer");

module.exports = function(context, cb) {
  if (context && cb) {
    return new JSON2Mail(context, cb).run(); // WebTask mode
  } else {
    return JSON2Mail; // Test mode
  }
};

class JSON2Mail {
  constructor(context, cb) {
    this.respond = cb;
    this.headers = context.headers;
    this.payload = context.body;
    this.email   = context.data.email;
  }

  run() {
    if (this.canSend()) {
      this.sendMail();
    } else {
      this.nack("can't send an email with current data");
    }
  }

  sendMail() {
    nodemailer.createTransport().sendMail({
      subject: "WebHook receive",
      from:    "WebTask Bot <bot@guille.moe>",
      to:      this.email,
      html:    this.renderHTML()
    }, (error, info) => {
      !!error ? this.nack(error) : this.ack(info);
    });
  }

  renderHTML() {
    return `
      ${this.renderHeaders()}
      ${this.renderPayload()}
    `;
  }

  renderHeaders() {
    return `
      <h4>Headers</h4>
      <table>
        <tbody>
          ${this.renderHeadersRows()}
        </tbody>
      </table>
      <br/>
    `;
  }

  renderHeadersRow(name, value) {
    return `
      <tr>
        <td>
          ${name}
        </td>
        <td>
          ${value}
        </td>
      </tr>
    `;
  }

  renderPayload() {
    return `
      <h4>Payload</h4>
      <pre>`+
        JSON.stringify(this.payload, null, '  ')+
      `</pre>
    `;
  }

  renderHeadersRows() {
    let rows = "";
    for(let name in this.headers) {
      rows += this.renderHeadersRow(name, this.headers[name]);
    }
    return rows;
  }

  canSend() {
    return !!this.headers && !!this.payload && !!this.email;
  }

  ack(val) {
    this.respond(null, {ack: val});
  }

  nack(val) {
    this.respond(null, {nack: val});
  }
}

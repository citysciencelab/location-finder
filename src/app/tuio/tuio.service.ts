/**
 * Adapted from: https://github.com/ekryski/caress-client
 * License: MIT
 * Copyright 2012 Eric Kryski
 */

import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { environment } from '../../environments/environment';
import { TuioPacket } from './packet.model';
import { TuioMessage } from './message.model';
import { Tuio2DCursor } from './2d-cursor.model';
import { Tuio2DObject } from './2d-object.model';

/**
 * Service implementing TUIO cursor and object events. Touch functionality is based on PointerEvent,
 * so it only works with clients supporting PointerEvent.
 */
@Injectable()
export class TuioService {
  protocol = '1.1';
  private socket: SocketIOClient.Socket;
  private connected: boolean;
  private defaultPacketSource: string;
  private cursors: {[key: string]: Tuio2DCursor[]};
  private objects: {[key: string]: Tuio2DObject[]};
  private clientSupportsPointerEvent: boolean;
  private clientSupportsTouchEvent: boolean;

  constructor() {
    this.connected = false;
    this.defaultPacketSource = environment.socketUrl.match(/.+\:\/\/([^/:]+)/)[1]; // extract hostname from URL
    this.cursors = {};
    this.objects = {};
    this.clientSupportsPointerEvent = typeof PointerEvent !== 'undefined';
  }

  connect() {
    this.socket = io.connect(environment.socketUrl);
    this.socket.on('connect', this.onConnect.bind(this));
    this.socket.on('disconnect', this.onDisconnect.bind(this));
  }

  onConnect() {
    this.connected = true;

    this.socket.on('tuio', this.processPacket.bind(this));

    if (!environment.production) {
      console.log('Connected to Socket.io');
    }
  }

  onDisconnect() {
    this.connected = false;

    this.cursors = {};
    this.objects = {};

    if (!environment.production) {
      console.log('Disconnected from Socket.io');
    }
  }

  ensureArraysAreInitialized(key: string) {
    if (!this.cursors[key]) {
      this.cursors[key] = [];
    }
    if (!this.objects[key]) {
      this.objects[key] = [];
    }
  }

  processPacket(packet: TuioPacket) {
    // It's a regular message and not a bundle
    // TODO: Figure out what to do. Haven't seen one of these yet
    if (!packet.bundle) {
      return;
    }
    // Ignore duplicate packets for now
    if (!packet.duplicate) {
      // Default all the sources to socket host
      // We override this if a source was actually provided!
      packet.source = this.defaultPacketSource;
      this.ensureArraysAreInitialized(packet.source);

      for (const message of packet.messages) {
        switch (message.profile) {
          case '/tuio/2Dcur':
            this.process2DCursor.bind(this)(packet, message);
            break;
          case '/tuio/2Dobj':
            this.process2DObject.bind(this)(packet, message);
            break;
        }
      }
    }
  }

  process2DCursor(packet: TuioPacket, message: TuioMessage) {
    switch (message.type) {
      case 'source':
        packet.source = message.address;
        this.ensureArraysAreInitialized(packet.source);
        break;

      case 'alive':
        // If sessionsIds is undefined, it likely means there are no active cursors
        if (!message.sessionIds) {
          message.sessionIds = [];
        }

        // Remove the non-active cursors from the cursor namespace
        this.cursors[packet.source] = this.cursors[packet.source].filter(cursorItem => {
          if (message.sessionIds.indexOf(cursorItem.sessionId) > -1) {
            return true;
          }
          this.createPointerEvent('pointerup', cursorItem);
          return false;
        });
        break;

      case 'set':
        const cursor = new Tuio2DCursor(message);
        const existingCursor = this.cursors[packet.source].find(item => item.sessionId === cursor.sessionId);
        const existingCursorIndex = this.cursors[packet.source].indexOf(existingCursor);

        if (existingCursor) {
          // Existing cursor so we update it
          this.cursors[packet.source][existingCursorIndex] = cursor;
          this.createPointerEvent('pointermove', cursor);
        } else {
          // New cursor
          this.cursors[packet.source].push(cursor);
          this.createPointerEvent('pointerdown', cursor);
        }
    }
  }

  process2DObject(packet: TuioPacket, message: TuioMessage) {
    switch (message.type) {
      case 'source':
        packet.source = message.address;
        this.ensureArraysAreInitialized(packet.source);
        break;

      case 'alive':
        // If sessionsIds is undefined, it likely means there are no active objects
        if (!message.sessionIds) {
          message.sessionIds = [];
        }

        // Remove the non-active objects from the object namespace
        this.objects[packet.source] = this.objects[packet.source].filter(objectItem => {
          if (message.sessionIds.indexOf(objectItem.sessionId) > -1) {
            return true;
          }
          this.createObjectEvent('removeobject', objectItem);
          return false;
        });
        break;

      case 'set':
        const object = new Tuio2DObject(message);
        const existingObject = this.objects[packet.source].find(item => item.sessionId === object.sessionId);
        const existingObjectIndex = this.objects[packet.source].indexOf(existingObject);

        if (existingObject) {
          // Existing object so we update it
          this.objects[packet.source][existingObjectIndex] = object;
          this.createObjectEvent('updateobject', object);
        } else {
          // New object
          this.objects[packet.source].push(object);
          this.createObjectEvent('addobject', object);
        }
    }
  }

  createPointerEvent(type: string, cursor: Tuio2DCursor) {
    if (!this.clientSupportsPointerEvent) {
      throw new Error('This browser doesn\'t support PointerEvent');
    }

    const pageX = document.documentElement.clientWidth * cursor.xPosition;
    const pageY = document.documentElement.clientHeight * cursor.yPosition;
    const target = document.elementFromPoint(pageX, pageY);

    const pointerEvent = new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: cursor.sessionId,
      pointerType: 'touch',
      screenX: screen.width * cursor.xPosition,
      screenY: screen.height * cursor.yPosition,
      clientX: window.innerWidth * cursor.xPosition,
      clientY: window.innerHeight * cursor.yPosition,
    });

    // Dispatch the event
    if (target) {
      target.dispatchEvent(pointerEvent);
    } else {
      document.dispatchEvent(pointerEvent);
    }
  }

  createObjectEvent(type: string, object: Tuio2DObject) {
    const pageX = document.documentElement.clientWidth * object.xPosition;
    const pageY = document.documentElement.clientHeight * object.yPosition;
    const target = document.elementFromPoint(pageX, pageY);

    const objectEvent = new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail: object
    });

    if (target) {
      target.dispatchEvent(objectEvent);
    } else {
      document.dispatchEvent(objectEvent);
    }
  }
}

import { TuioMessage } from './message.model';

export interface TuioPacket {
  bundle: boolean;
  duplicate: boolean;
  messages: TuioMessage[];
  source: string;
}

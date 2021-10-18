import {
  EventOnAddStream,
  RTCIceCandidate,
  RTCIceCandidateType,
  RTCPeerConnection,
  RTCPeerConnectionConfiguration,
  RTCSessionDescription,
  RTCSessionDescriptionType,
} from 'react-native-webrtc';

const userFactory = () => {
  let receiver: string | null = null;
  let sender: string | null = null;

  return {
    setReceiver: (newUserID: string) => {
      receiver = newUserID;
    },
    getReceiver: (): string | null => {
      return receiver || null;
    },
    setSender: (newUserID: string) => {
      sender = newUserID;
    },
    getSender: (): string | null => {
      return sender || null;
    },
  };
};

export const sessionDescription = (info: RTCSessionDescription) => {
  return new RTCSessionDescription(info);
};

export const iceCandidate = (iceCandidateType: RTCIceCandidateType) => {
  return new RTCIceCandidate(iceCandidateType);
};

export const peerConnection = (
  configuration: RTCPeerConnectionConfiguration,
) => {
  const instance = new RTCPeerConnection(configuration);

  return {
    getInstance: () => {
      return instance;
    },
    setRemoteDescription: async (description: RTCSessionDescription) => {
      await instance.setRemoteDescription(description);
    },
    onIceCandidate: (senderID: string, receiverID: string, ws: WebSocket) => {
      instance.onicecandidate = event => {
        if (event.candidate) {
          ws.send(
            JSON.stringify({
              type: 'newIceCandidate',
              payload: {
                from: senderID,
                to: receiverID,
                candidate: event.candidate,
              },
            }),
          );
        }
      };
    },
    createAnswer: () => {
      return instance.createAnswer();
    },
    setLocalDescription: async (answer: RTCSessionDescriptionType) => {
      await instance.setLocalDescription(answer);
    },
    onAddStream: (onSet: (stream: EventOnAddStream) => void) => {
      instance.onaddstream = event => {
        onSet(event);
      };
    },
  };
};

export const socket = (uri = 'wss://vdc-api.dewadg.pro/ws/signaling') => {
  const instance = new WebSocket(uri);
  let message: string | null = null;

  return {
    getInstance: () => {
      return instance;
    },
    signIn: (senderID: string) => {
      instance.onopen = () => {
        instance.send(
          JSON.stringify({
            type: 'signIn',
            payload: {
              from: senderID,
            },
          }),
        );
      };
    },
    onMessage: () => {
      instance.onmessage = newMessage => {
        const {data} = newMessage;

        const parsedData = JSON.parse(data);
        message = parsedData;

        return parsedData;
      };
    },
    receiveVideoOffer: async (
      senderID: string,
      sessionDescriptionType: RTCSessionDescriptionType,
    ) => {
      await instance.send(
        JSON.stringify({
          type: 'videoAnswer',
          payload: {
            from: senderID,
            to: message?.payload?.from,
            sdp: sessionDescriptionType,
          },
        }),
      );
    },
    onError: (callback: (e: WebSocketErrorEvent) => void) => {
      instance.onerror = e => {
        callback(e);
      };
    },
    onClose: (callback: (e: WebSocketCloseEvent) => void) => {
      instance.onclose = e => {
        callback(e);
      };
    },
    onOpen: (senderID: string) => {
      instance.send(
        JSON.stringify({
          type: 'signIn',
          payload: {
            from: senderID,
          },
        }),
      );
    },
  };
};

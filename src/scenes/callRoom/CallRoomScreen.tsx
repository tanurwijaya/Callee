import React, {createRef, useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from 'react-native-webrtc';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const MY_USER_ID = 'tanurwijaya';

const CallRoomScreen = () => {
  const ws = new WebSocket('wss://vdc-api.dewadg.pro/ws/signaling');
  const cameraRef = createRef<RNCamera>();
  const [cameraFacing, setCameraFacing] = useState(
    RNCamera.Constants.Type.front,
  );

  const [stream, setStream] = useState(null);

  const configuration = {iceServers: [{url: 'stun:stun.stunprotocol.org'}]};
  const pc = new RTCPeerConnection(configuration);

  const toogleCameraFacing = () => {
    if (cameraFacing === RNCamera.Constants.Type.front) {
      setCameraFacing(RNCamera.Constants.Type.back);
    } else {
      setCameraFacing(RNCamera.Constants.Type.front);
    }
  };

  ws.onopen = () => {
    // connection opened
    console.log('ONOPEN');
    ws.send(
      JSON.stringify({
        type: 'signIn',
        payload: {
          from: MY_USER_ID,
        },
      }),
    );
  };

  pc.onicecandidate = async (event: any) => {
    console.log({event});
    if (!event.candidate) {
      return;
    }

    await ws.send(
      JSON.stringify({
        type: 'newIceCandidate',
        payload: {
          from: MY_USER_ID,
          to: 'dewadg',
          candidate: event.candidate,
        },
      }),
    );
  };

  const handleReceiveIceCandidate = async (payload: any) => {
    const candidate = new RTCIceCandidate(payload.candidate.candidate);
    await pc.addIceCandidate(candidate);
  };

  ws.onmessage = e => {
    const parsedData = JSON.parse(e.data);
    console.log({parsedData});
    const {payload, type} = parsedData;
    console.log({type});
    switch (type) {
      case 'videoOffer':
        const {from, sdp, to} = payload;
        if (to === MY_USER_ID) {
          pc.createAnswer().then(desc => {
            pc.setLocalDescription(desc).then(() => {
              console.log('try to send sdp');
              console.log({desc})
              ws.send(
                JSON.stringify({
                  type: 'videoAnswer',
                  payload: {
                    from: MY_USER_ID,
                    to: from,
                    sdp: desc.sdp,
                  },
                }),
              );
            });
          });
        }
        break;
      case 'newIceCandidate':
        console.log('newIceCandidate');
        handleReceiveIceCandidate(payload)
          .then(() => {})
          .catch(e => console.log({e}));
      default:
        break;
    }
  };

  ws.onerror = e => {
    console.log('error', e.message);
  };

  ws.onclose = e => {
    console.log(e.code, e.reason);
  };

  pc.ontrack = event => {
    console.log({ontrackevent: event});
    // this.remoteVideoStream = event.streams[0]
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      {stream ? (
        <RTCView streamURL={stream.toURL()} style={{flex: 1}} />
      ) : (
        <View style={{backgroundColor: 'black', flex: 1}} />
      )}
      <View style={styles.previewWrapper}>
        <RNCamera
          ref={cameraRef}
          style={styles.preview}
          type={cameraFacing}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
        />
        <TouchableOpacity
          onPress={toogleCameraFacing}
          style={{
            width: 32,
            height: 32,
            bottom: 8,
            left: -16,
            backgroundColor: 'white',
            borderRadius: 8,
            position: 'absolute',
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 32,
          left: 0,
          right: 0,
          justifyContent: 'center',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <View
          style={{
            width: 48,
            height: 48,
            backgroundColor: 'gray',
            opacity: 0.3,
            borderRadius: 24,
            marginHorizontal: 8,
          }}
        />
        <View
          style={{
            width: 64,
            height: 64,
            backgroundColor: 'tomato',
            borderRadius: 32,
            marginHorizontal: 16,
          }}
        />
        <View
          style={{
            width: 48,
            height: 48,
            backgroundColor: 'gray',
            opacity: 0.3,
            borderRadius: 24,
            marginHorizontal: 8,
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  previewWrapper: {
    zIndex: 32,
    position: 'absolute',
    right: 30,
    top: 8,
    width: windowWidth / 4,
    height: windowHeight / 4,
  },
  preview: {
    borderRadius: 32,
    width: windowWidth / 4,
    height: windowHeight / 4,
  },
});

export default CallRoomScreen;

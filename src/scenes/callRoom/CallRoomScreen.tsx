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
  const cameraRef = createRef<RNCamera>();
  const [cameraFacing, setCameraFacing] = useState(
    RNCamera.Constants.Type.front,
  );
  const [stream, setStream] = useState(null);

  // const ws = useRef(null);
  //
  // useEffect(() => {
  //   ws.current = new WebSocket('wss://vdc-api.dewadg.pro/ws/signaling');
  //   console.log('useeffect');
  //   ws.current.onopen = () => {
  //     console.log('onopen');
  //     ws.current.send(
  //       JSON.stringify({
  //         type: 'signIn',
  //         payload: {},
  //       }),
  //     );
  //   };
  //   ws.current.onclose = () => console.log('ws closed');
  //
  //   const wsCurrent = ws.current;
  //
  //   return () => {
  //     wsCurrent.close();
  //   };
  // }, []);
  //
  // useEffect(() => {
  //   if (!ws) return;
  //   ws.current.onmessage = e => {
  //     const message = JSON.parse(e.data);
  //     console.log('e', message);
  //   };
  // }, [ws]);

  const configuration = {iceServers: [{url: 'stun:stun.stunprotocol.org'}]};
  const pc = new RTCPeerConnection(configuration);

  // mediaDevices.enumerateDevices().then(sourceInfos => {
  //   console.log(sourceInfos);
  //   let videoSourceId;
  //   for (let i = 0; i < sourceInfos.length; i++) {
  //     const sourceInfo = sourceInfos[i];
  //     if (
  //       sourceInfo.kind == 'videoinput' &&
  //       sourceInfo.facing == (RNCamera.Constants.Type.front ? 'front' : 'back')
  //     ) {
  //       videoSourceId = sourceInfo.deviceId;
  //     }
  //   }
  //   mediaDevices
  //     .getUserMedia({
  //       audio: true,
  //       video: {
  //         width: 640,
  //         height: 480,
  //         frameRate: 30,
  //         facingMode:
  //           cameraFacing === RNCamera.Constants.Type.front ? 'front' : 'back',
  //         deviceId: videoSourceId,
  //       },
  //     })
  //     .then(stream => {
  //       // Got stream!
  //     })
  //     .catch(error => {
  //       // Log error
  //     });
  // });

  const toogleCameraFacing = () => {
    if (cameraFacing === RNCamera.Constants.Type.front) {
      setCameraFacing(RNCamera.Constants.Type.back);
    } else {
      setCameraFacing(RNCamera.Constants.Type.front);
    }
  };

  const ws = new WebSocket('wss://vdc-api.dewadg.pro/ws/signaling');

  ws.onopen = () => {
    // connection opened
    console.log('ONOPEN');
    ws.send(
      JSON.stringify({
        type: 'signIn',
        payload: {
          username: 'tanurwijaya',
        },
      }),
    );
  };

  ws.onmessage = e => {
    // a message was received
    console.log(e.data);
    const parsedData = JSON.parse(e.data);
    const {payload} = parsedData;
    const {from, sdp, to} = payload;
    if (to === MY_USER_ID) {
      pc.createOffer().then(desc => {
        pc.setLocalDescription(desc).then(() => {
          console.log('try to send sdp');
          ws.send(
            JSON.stringify({
              type: 'videoAnswer',
              payload: {
                from: MY_USER_ID,
                to: from,
                sdp: desc,
              },
            }),
          );
          startStream();
        });
      });
    }
  };

  const startStream = async () => {
    try {
      const s = await mediaDevices.getUserMedia({video: true});
      console.log({s});
      setStream(s);
    } catch (e) {
      console.error(e);
    }
  };

  ws.onerror = e => {
    // an error occurred
    console.log('error', e.message);
  };

  ws.onclose = e => {
    // connection closed
    console.log(e.code, e.reason);
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      {stream ? (
        <RTCView
          streamURL={stream.toURL()}
          style={{backgroundColor: 'black', flex: 1}}
        />
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

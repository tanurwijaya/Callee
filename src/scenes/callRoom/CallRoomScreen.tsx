import React, {createRef, useState} from 'react';
import {SafeAreaView, View, StyleSheet, Dimensions} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCView,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const MY_USER_ID = 'tanurwijaya';

const configuration = {iceServers: [{url: 'stun:stun.stunprotocol.org'}]};

const pc = new RTCPeerConnection(configuration);

const ws = new WebSocket('wss://vdc-api.dewadg.pro/ws/signaling');

const CallRoomScreen = () => {
  const cameraRef = createRef<RNCamera>();

  const [cameraFacing, setCameraFacing] = useState(
    RNCamera.Constants.Type.front,
  );

  const [stream, setStream] = useState(null);

  const [selfStream, setSelfStream] = React.useState();

  const [iceCandidate, setIceCandidate] = React.useState(false);

  const [pcIceCandidate, setPcIceCandidate] = React.useState(false);

  const [videoOffer, setVideoOffer] = React.useState(false);

  React.useEffect(() => {
    mediaDevices.enumerateDevices().then(sourceInfos => {
      console.log(sourceInfos);
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind === 'videoinput' &&
          sourceInfo.facing === (cameraFacing ? 'front' : 'environment')
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }

      mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            width: 640,
            height: 480,
            frameRate: 30,
            facingMode: 'user',
            deviceId: videoSourceId,
          },
        })
        .then(currentStream => {
          if (!selfStream && currentStream) {
            console.log('PLERPLERPLER');
            pc.addStream(currentStream as MediaStream);
            setSelfStream(currentStream);
          }
        })
        .catch(error => {
          console.log('STREAM ERROR BANGSAT', error);
        });
    });
  }, []);

  ws.onmessage = e => {
    const parsedData = JSON.parse(e.data);
    const {payload, type} = parsedData;

    switch (type) {
      case 'videoOffer':
        const {from, sdp, to} = payload;
        if (to === MY_USER_ID) {
          if (!videoOffer) {
            setVideoOffer(true);

            setTimeout(() => {
              handleReceiveVideoOffer(parsedData).then(() => {
                console.log('HELLOW');
              });
            }, 0);
          }
        }
        break;
      case 'newIceCandidate':
        if (!iceCandidate) {
          setIceCandidate(true);
          setTimeout(() => {
            handleReceiveIceCandidate(parsedData)
              .then(() => {
                console.log('handleReceiveIceCandidate');
              })
              .catch(e => console.log('CATCH newIceCandidate', {e}));
          }, 1000);
        }
        break;
      default:
        break;
    }
  };

  ws.onerror = e => {
    console.log('errorWEY', e.message);
  };

  ws.onclose = e => {
    console.log(e.code, e.reason);
  };

  pc.onaddstream = event => {
    console.log({ontrackevent: event});
    if (!stream) {
      setStream(event.stream);
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

  pc.onicecandidate = event => {
    if (event.candidate) {
      ws.send(
        JSON.stringify({
          type: 'newIceCandidate',
          payload: {
            from: MY_USER_ID,
            to: 'dewadg',
            candidate: event.candidate,
          },
        }),
      );
    }
  };

  const toogleCameraFacing = () => {
    if (cameraFacing === RNCamera.Constants.Type.front) {
      setCameraFacing(RNCamera.Constants.Type.back);
    } else {
      setCameraFacing(RNCamera.Constants.Type.front);
    }
  };

  const handleReceiveIceCandidate = React.useCallback(async (message: any) => {
    const candidate = new RTCIceCandidate(message.payload.candidate);
    await pc.addIceCandidate(candidate);
  }, []);

  const handleReceiveVideoOffer = React.useCallback(async message => {
    const desc = new RTCSessionDescription(message.payload.sdp);
    await pc.setRemoteDescription(desc);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await ws.send(
      JSON.stringify({
        type: 'videoAnswer',
        payload: {
          from: MY_USER_ID,
          to: message.payload.from,
          sdp: pc.localDescription,
        },
      }),
    );
  }, []);

  return (
    <SafeAreaView style={{flex: 1}}>
      {stream ? (
        <RTCView streamURL={stream?.toURL()} style={{flex: 1}} />
      ) : (
        <View style={{backgroundColor: 'black', flex: 1}} />
      )}
      {selfStream && (
        <RTCView streamURL={selfStream?.toURL()} style={{flex: 1}} />
      )}
      {/*<View style={styles.previewWrapper}>*/}
      {/*  <RNCamera*/}
      {/*    ref={cameraRef}*/}
      {/*    style={styles.preview}*/}
      {/*    type={cameraFacing}*/}
      {/*    flashMode={RNCamera.Constants.FlashMode.on}*/}
      {/*    androidCameraPermissionOptions={{*/}
      {/*      title: 'Permission to use camera',*/}
      {/*      message: 'We need your permission to use your camera',*/}
      {/*      buttonPositive: 'Ok',*/}
      {/*      buttonNegative: 'Cancel',*/}
      {/*    }}*/}
      {/*    androidRecordAudioPermissionOptions={{*/}
      {/*      title: 'Permission to use audio recording',*/}
      {/*      message: 'We need your permission to use your audio',*/}
      {/*      buttonPositive: 'Ok',*/}
      {/*      buttonNegative: 'Cancel',*/}
      {/*    }}*/}
      {/*  />*/}
      {/*  <TouchableOpacity*/}
      {/*    onPress={toogleCameraFacing}*/}
      {/*    style={{*/}
      {/*      width: 32,*/}
      {/*      height: 32,*/}
      {/*      bottom: 8,*/}
      {/*      left: -16,*/}
      {/*      backgroundColor: 'white',*/}
      {/*      borderRadius: 8,*/}
      {/*      position: 'absolute',*/}
      {/*    }}*/}
      {/*  />*/}
      {/*</View>*/}
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

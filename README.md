#AngularJS WebRTC Module

## Dependencies

- angular-base64

## Setup

```bower install https://github.com/lp1dev/ngWebRTC.git```

## Usage

Add the following lines to your index.html :
```
<script type="text/javascript" src="{bower_directory}/angular-base64/angular-base64.js"></script>
<script type="text/javascript" src="{bower_directory}/angular-webrtc/dist/js/ngWebRTC.js"></script>
```

This module provides a **$webrtc** service to handle your WebRTC interactions.

Browser-related interactions have been wrapped to be as easy to use as possible, but you will probably **need at least a basic 
understanding of the [WebRTC protocol](https://www.w3.org/TR/webrtc)**.

### Initialisation

First, you have to retrieve your local browser's stream using 

```   
$webrtc.getUserMedia (onUserMediaSuccess, onUserMediaError, constraints);
```

- **onUserMediaSuccess(stream)** callback is entered when the browser has successfully retrieved a media stream from the local 
camera/microphone.
- **onUserMediaError(error)** callback is entered when it failed, for instance if you refused to share your audio/video 
in the popup window.
- **constraints** is an *optional* object, used to specify if you want to share your audio,video or both. By default its
value is {audio:true, video:true}.

Then you have to call the **init** method to initialize the service.

```
$webrtc.init (stream, connectCallback, disconnectCallback, pendingCallback, iceConfig, serverConfig)
```

- **stream** is the Stream object retrieved from the onUserMediaSuccess callback.
- **connectCallback** is entered when you successfully connect to another user's stream
- **disconnectCallback** is entered when this stream hangs.
- **pendingCallback** is entered when you are trying to connect.
- **iceConfig** is the configuration passed to the [RTCPeerConnection Interface](https://www.w3.org/TR/webrtc/#rtcpeerconnection-interface).
If undefined { 'iceServers': [ { 'urls': 'stun.l.google.com:19302' } ] } will be used.
- **serverConfig** is your own server configuration, the object needs to be formatted like this :
```
serverConfig = {
      url: 'http(s)://{Your Server's  URL}',
      methods: {
        postIceCandidate: function (candidate, emitter) { //Your post request here },
        postOffer: function (RTCDescription, emitter, type) { //Your post request here }
      }
    }
```

### Actions on new offers

Now that you can send offers and IceCandidates on your server, you should be able to handle the offers reception inside your controller.

Once you've been able to retrieve an offer's data, you can accept another's user offer using

```
$webrtc.acceptOffer(offer)
```

The offer object must be formatted like this : 
```
offer = {
    type: 'rdp-offer'
    emitter: {An identifier for the user emitting the offer},
    RDPDescription: {The same RTCDescription object given to the postOffer method}
}
```

Upon approval, an answer like this one  :
```
answer = {
    type: 'sdp-answer'
    emitter: {An identifier for the user emitting the answer},
    RDPDescription: {Your RTCDescription}
}
```

will automatically be sent to your server using the same *serverConfig.methods.postOffer* method.

The Ice candidates will be automatically handled and sent to your server in an object like this :
```
iceCandidate = {
    type: 'ice',
    emitter: {An identifier for the user emitting the ice candidate},
    ice: {The ice candidate given by your the emitter's browser}
}
```

It must be communicated to the corresponding recipient and the same iceCandidate object given to the $webrtc.onExternalIceCandidate method
for the connection to be established.

## Streams

Once the local stream has been configured, you can retrieve it using : 
$webrtc.getLocalMediaStream().

If an external connection is successfull you can retrieve the external stream using : 
$webrtc.getExternalMediaStream().

You can now store these objects in a streamURL Object for your browser to be able to display it :
```
$scope.streamURL = window.URL.createObjectURL(stream)
```

They both can be displayed in a HTML video element like this
```
<video autoplay ng-src="{{ $scope.streamURL //Your stream object, $scope.streamURL for instance }}">
```


[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

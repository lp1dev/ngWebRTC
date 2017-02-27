/* global RTCPeerConnection, angular */
;(function () {
  'use strict'

  angular
    .module('ngWebRTC')
    .factory('$webrtc', webRTCService)

  webRTCService.$inject = [ '$q', '$base64' ]

  function webRTCService ($q, $base64) {
    // Multi-browser globals config hacks
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection
    window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate
    window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription
    navigator.getUserMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia)

    // Local variables
    var _iceConfig = { 'iceServers': [ { 'urls': 'stun.l.google.com:19302' } ] } // Default iceServer configuration
    var _serverConfig = {
      url: '',
      methods: {
        postIceCandidate: function (candidate, recipientId) { console.log('ngWebRTC :: posting Ice Candidate : ') },
        postOffer: function (RTCDescription, recipientId, type) { console.log('ngWebRTC :: posting offer data : ') }
      }
    }
    var _sdpConstraints = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    }
    var _stream
    var _offers = []
    var _ice = []
    var _externalStream
    var _disconnectCallback, _connectCallback, _pendingCallback
    var peerConnections = {}

    var service = {
      getOffers: getOffers,
      acceptOffer: acceptOffer,
      refuseOffer: refuseOffer,
      createOffer: createOffer,
      getExternalMediaStream: getExternalMediaStream,
      getLocalMediaStream: getLocalMediaStream,
      getUserMedia: getUserMedia,
      init: init,
      onExternalIceCandidate: onExternalIceCandidate
    }

    return service

    //

    function getUserMedia (onUserMediaSuccess, onUserMediaError, constraints) {
      if (undefined === constraints) {
        navigator.getUserMedia({ audio: true, video: true }, onUserMediaSuccess, onUserMediaError)
      } else {
        navigator.getUserMedia(constraints, onUserMediaSuccess, onUserMediaError)
      }
    }

    function init (stream, connectCallback, disconnectCallback, pendingCallback, iceConfig, serverConfig) {
      _stream = stream
      _connectCallback = connectCallback
      _disconnectCallback = disconnectCallback
      _pendingCallback = pendingCallback
      if (undefined !== iceConfig) {
        _iceConfig = iceConfig
      }
      if (undefined !== serverConfig) {
        _serverConfig = serverConfig
      }
    }

    function getPeerConnection (id) {
      if (peerConnections[ id ]) {
        return peerConnections[ id ]
      }
      var peerConnection = new RTCPeerConnection(_iceConfig)
      peerConnections[ id ] = peerConnection
      peerConnection.addStream(_stream)
      peerConnection.onicecandidate = function (event) { onIceCandidate(event, id) }
      peerConnection.onaddstream = onAddStream
      peerConnection.oniceconnectionstatechange = function () { onIceConnectionStateChange(peerConnection.iceConnectionState) }
      return peerConnection
    }

    function onIceConnectionStateChange (state) {
      console.log('Connection state changed', state)

      switch (state) {
        case 'disconnected':
          _disconnectCallback(state)
          break
        case 'connected':
          _connectCallback(state)
          break
        case 'completed':
          _connectCallback(state)
          break
        case 'checking':
          _pendingCallback(state)
          break
        default:
          _pendingCallback(state)
          break
      }
    }

    function getLocalMediaStream () {
      return _stream
    }

    function getExternalMediaStream () {
      return _externalStream
    }

    function onAddStream (event) {
      console.log('Got new stream :: ', event)
      _externalStream = event.stream
    }

    function onIceCandidate (event, recipient) {
      console.log('Got ice candidate', event.candidate)
      if (event.candidate !== null) {
        _serverConfig.methods.postIceCandidate(event.candidate, recipient)
          .then(function () {
            console.log('ngWebRTC :: Ice candidate correctly sent')
          })
          .catch(function (error) {
            console.log('ngWebRTC :: Ice candidate error', error)
          })
      }
    }

    function onExternalIceCandidate (iceCandidate) {
      var peerConnection = getPeerConnection(iceCandidate.emitter)
      peerConnection.addIceCandidate(new window.RTCIceCandidate(iceCandidate.ice))
    }

    function acceptAnswer (answer) {
      var peerConnection = getPeerConnection(answer.emitter)
      answer = { sdp: answer.RTCDescription, type: 'answer', emitter: answer.emitter }
      console.log('Accepting answer : ', answer)
      angular.forEach(_ice, function (iceCandidate) {
        peerConnection.addIceCandidate(new window.RTCIceCandidate(iceCandidate))
      })
      peerConnection.setRemoteDescription(
        new window.RTCSessionDescription(answer), function () {
          console.log('Added answer as local description : ', answer)
        },
        function (error) {
          console.log(error)
        }
      )
    }

    function acceptOffer (offer) {
      var peerConnection = getPeerConnection(offer.emitter)
      offer = { sdp: offer.RTCDescription, type: 'offer', emitter: offer.emitter }
      peerConnection.setRemoteDescription(new window.RTCSessionDescription(offer))
      angular.forEach(_ice, function (iceCandidate) {
        peerConnection.addIceCandidate(new window.RTCIceCandidate(iceCandidate))
      })
      peerConnection.createAnswer(
        function (description) {
          peerConnection.setLocalDescription(description)
          _serverConfig.methods.postOffer(description, offer.emitter, 'sdp-answer')
            .then(function () {
              console.log('ngWebRTC :: acceptOffer success')
            })
            .catch(function (error) {
              console.log('ngWebRTC :: acceptOffer error', error)
            })
        },
        function (error) {
          console.log(error)
        })
    }

    function createOffer (recipientId) {
      var peerConnection = getPeerConnection(recipientId)
      peerConnection
        .createOffer(
          function (RTCDescription) {
            peerConnection.setLocalDescription(RTCDescription)
            _serverConfig.methods.postOffer(RTCDescription, recipientId)
          },
          function (error) {
            console.log(error)
          },
          _sdpConstraints)
    }

    function refuseOffer (offer) {
    }

    function parseData (offers) {
      _offers = []
      angular.forEach(offers, function (offer) {
        switch (offer.type) {
          case 'sdp-offer':
            offer.RTCDescription = $base64.decode(offer.RTCDescription)
            _offers.push(offer)
            break
          case 'sdp-answer':
            offer.RTCDescription = $base64.decode(offer.RTCDescription)
            acceptAnswer(offer)
            break
          case 'ice':
            console.log('got ice from server : ', offer)
            _ice.push(offer.ice)
            break
        }
      })
      return _offers
    }

    function getOffers () {
      var deferred = $q.defer()
      _serverConfig.methods.get('/webrtc/offer')
        .then(function (request) {
          deferred.resolve(parseData(request.data.offers))
        })
        .catch(function (error) {
          deferred.reject(error)
        })
      return deferred.promise
    }
  }
})()

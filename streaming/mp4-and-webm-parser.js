const EBML={HEAD:440786851,Segment:408125543,SeekHead:290298740,SegmentInformation:357149030,Tracks:374648427,Cues:475249515,CuePoint:187,CueTime:179,CueTrackPositions:183,CueTrack:247,CueClusterPosition:241,CueRelativePosition:240,CueDuration:178};function parseWEBMSegments(s){const a=new DataView(s);let t=0,e=0,u=0;if(a.getUint32()===EBML.HEAD&&(u+=4,u=n(!0),a.getUint32(u)===EBML.Segment)){u+=4;const r=n(!0);for(;u<r;)a.getUint32(u)===EBML.SeekHead?(t=u,u+=4,i(n(!0))):a.getUint32(u)===EBML.SegmentInformation||a.getUint32(u)===EBML.Tracks?(u+=4,i(n(!0))):a.getUint32(u)===EBML.Cues&&(e=u,u+=4,u=n(!0))}function n(t=!1){var e=[a.getUint8(u)];let n=128,i=127;for(let t=0;t<8;t++){if(e[0]&n){e[0]&=i;break}n>>=1,i>>=1,e.push(null)}u++;for(let t=1;t<e.length;t++)e[t]=a.getUint8(u),u++;let o=0;for(const r of e)o=o<<8|r;return t?Math.min(u+o,s.byteLength):o}function i(t){let e=0;for(;u<t;)e=e<<8|a.getUint8(u),u++;return e}function o(){u++;var t=n();u+=t}if(u=e,a.getUint32(u)!==EBML.Cues)throw new TypeError("This is not 'Cues' Element");u+=4;const r=n(!0);for(var g=[];u<r;)if(a.getUint8(u)===EBML.CuePoint){u++;const r=n(!0);for(var l={};u<r;)if(a.getUint8(u)===EBML.CueTime){if("time"in l)throw new TypeError("Invalid layout, 'CueTime' found multiple times in a single 'CuePoint'");u++,l.time=i(n(!0))/1e3}else if(a.getUint8(u)===EBML.CueTrackPositions){u++;const r=n(!0);"positions"in l||(l.positions=[]);for(var f={};u<r;)a.getUint8(u)===EBML.CueTrack?(u++,f.track=i(n(!0))):a.getUint8(u)===EBML.CueClusterPosition?(u++,f.clusterPosition=t+i(n(!0))):o();l.positions.push(f)}else o();if(!("time"in l))throw new TypeError("Invalid layout, cannot find mandatory 'CueTime' Element inside 'CuePoint'");if(!("positions"in l))throw new TypeError("Invalid layout, cannot find at least one mandatory 'CueTrackPositions' Element inside 'CuePoint'");g.push(l)}else o();return g}function parseMP4Segments(t){var e=new DataView(t);let n=0,i=0;for(;n<t.byteLength;){var o=e.getUint32(n),r=(n+=4,e.getUint32(n));if(n+=4,1936286840===r){i=n+o-8;break}n+=o-8}var s=e.getUint8(n),a=(n+=8,e.getUint32(n));n+=4;let u=0,g=0;0===s?(u=e.getUint32(n),n+=4,g=i+e.getUint32(n),n+=4):(u=Number(e.getBigUint64(n)),n+=8,g=i+Number(e.getBigUint64(n)),n+=8),n+=2;var l=e.getUint16(n),f=(n+=2,[]);for(let t=0;t<l;t++){var m=2147483647&e.getUint32(n),U=e.getUint32(n+4)/a,C={position:g,time:u};f.push(C),g+=m,u+=U,n+=12}return f}

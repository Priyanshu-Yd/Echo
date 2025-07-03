import React, { useRef, useState } from "react";
import { useEffect } from "react";
import { BiSearch, BiVideo, BiVideoOff } from "react-icons/bi";
import { AiOutlineAudio, AiOutlineAudioMuted } from 'react-icons/ai'
import { BsCameraVideo } from "react-icons/bs";
import { HiOutlineFaceSmile } from 'react-icons/hi2'
import { FiChevronDown, FiLogOut } from "react-icons/fi";
import { IoCallOutline } from "react-icons/io5";
import { RxCross2 } from 'react-icons/rx'
import { ChatDay, GroupMsg, MsgReceived, MsgSent } from ".";
import axios from "axios";
import io from "socket.io-client";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setSecondRecall } from "../../store/secondRecall";
import EmojiPicker from "emoji-picker-react";
import RightSlider from "./SidebarReplacements/RightSlider";
import { DotPulse } from '@uiball/loaders'
import ReactPlayer from 'react-player'
import Peer from 'simple-peer'
import sendSound from '../../sendSound.mp3'
import callSound from '../../VideoCall.mp3'
import { MdCallEnd } from 'react-icons/md'
import { IoIosCall } from 'react-icons/io'
import { useStopwatch } from "react-timer-hook";
import { MdSummarize } from 'react-icons/md'
import SummaryModal from './SummaryModal';
import { MdTranslate } from 'react-icons/md'
import TranslationModal from './TranslationModal';
import { toast } from 'react-hot-toast';

let socket, selectedChatCompare;

const MainContainer = () => {
    const BASE_URL = process.env.REACT_APP_BASE_URL;
    const ENDPOINT = BASE_URL;
    const [media, setMedia] = useState(false);
    const [data, setData] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [reciver, setReciver] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    // eslint-disable-next-line
    const [socketConnected, setSocketConnected] = useState(false);
    let chatId = useSelector((state) => state.activeChat);
    const id = localStorage.getItem("id");
    const UserData = JSON.parse(localStorage.getItem("userData"));
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [myStream, setMyStream] = useState()
    const [showCalling, setShowCalling] = useState(false)
    const [callAccepted, setCallAccepted] = useState()
    const [call, setCall] = useState({})
    const [callDecline, setCallDecline] = useState(false)
    const [callFrom, setCallFrom] = useState()
    // eslint-disable-next-line
    const [showVideo, setShowVideo] = useState()
    const [showAudio, setShowAudio] = useState()
    const Dark = useSelector(state => state.darkMode)
    const [audio] = useState(new Audio(callSound))
    const [cantCall, setCantCall] = useState(false)
    const [isVideoCall, setIsVideoCall] = useState()
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summary, setSummary] = useState('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [summaryDays, setSummaryDays] = useState(7);
    const [isCleaningUp, setIsCleaningUp] = useState(false);
    const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState('en');
    const [selectedMessages, setSelectedMessages] = useState([]);

    // const myVideo = useRef()
    const UserVideo = useRef()
    const connectionRef = useRef()
    const {
        seconds,
        minutes,
        start,
        pause,
        reset,
      } = useStopwatch({ autoStart: true });

    const config = {
        headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    useEffect(() => {
        if (!chatId) {
            navigate("/home");
        }
        socket = io(ENDPOINT);
        socket.emit("setup", UserData);
        socket.on("connected", () => setSocketConnected(true));
        socket.on("typing", () => setIsTyping(true))
        socket.on("stop typing", () => setIsTyping(false))
        // eslint-disable-next-line

        return () => {
            socket.off("connected", () => setSocketConnected(true));
            socket.off("typing", () => setIsTyping(true))
            socket.off("stop typing", () => setIsTyping(false))
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const AllMessages = async () => {

            if (!chatId) return

            setShowEmoji(false)
            await axios.get(`${BASE_URL}/api/message/${chatId}`, config)
                .then((res) => {
                    setData(res.data.response.reverse());
                    socket.emit("join chat", res.data.response[0].chat._id);
                    socket.emit("stop typing", chatId);
                    setTyping(false)
                    setNewMessage('')
                })
                .catch((err) => {
                    console.log(err);
                });

            await axios.post(`${BASE_URL}/api/chat/getreciver`,
                {
                    chatId: chatId,
                },
                config,
            )
                .then((res) => {
                    let ref = res.data.users
                    let data = ref.filter((item) => item._id !== id);
                    // console.log(data)
                    setReciver(data[0]);
                })
                .catch((err) => {
                    console.log(err);
                });
        };
        AllMessages();
        selectedChatCompare = chatId
        // eslint-disable-next-line
    }, [chatId]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage === "") {
            return;
        }
        setIsSending(true);
        await axios
            .post(`${BASE_URL}/api/message`,
                {
                    chatId: chatId,
                    content: newMessage,
                },
                config,
            )
            .then((res) => {
                new Audio(sendSound).play()
                socket.emit("stop typing", chatId)
                setIsSending(false);
                setData([res.data.response, ...data]);
                socket.emit("new message", res.data.response);
                setNewMessage("");
                dispatch(setSecondRecall())
            })
            .catch((err) => {
                setIsSending(false);
                console.log(err);
                setNewMessage("");
            });
    };

    const Notify = async (id) => {
        console.log(chatId, id)
        dispatch(setSecondRecall())
        await axios.post(`${BASE_URL}/api/chat/addnew`, {
            chatId: id
        }, config)
            .then(res => {
                // console.log(res)
            })
            .catch(err => {
                // console.log(err)
            })
    }

    useEffect(() => {
        socket.on("message received", (newMessageReceived) => {
            if (selectedChatCompare !== newMessageReceived.chat._id) {
                Notify(newMessageReceived.chat._id);
            } else {

                Proceed(newMessageReceived)
            }
        });
    });

    const Proceed = (newMessageReceived) => {
        if (newMessageReceived.chat._id !== chatId) {
            return 
        } else {
            setData([newMessageReceived, ...data]);
            dispatch(setSecondRecall())
        }
    }

    const getDate = (timeStamp) => {
        const newTimeStamp = new Date(timeStamp).getTime();
        const date = new Intl.DateTimeFormat("en-In", {
            timeZone: "Asia/Kolkata",
            dateStyle: "short",
        }).format(newTimeStamp);
        return date;
    };

    const typingHandler = () => {
        setShowEmoji(false)

        if (!socketConnected) return

        if (newMessage === '') {
            socket.emit("stop typing", chatId);
            setTyping(false)
        }

        if (!typing) {
            socket.emit("typing", chatId)
            setTyping(true)
        }

        setTimeout(() => {
            socket.emit("stop typing", chatId);
            setTyping(false)
        }, 2000)
    }

    const stopVideo = () => {
        const videoTrack = myStream.getTracks().find(track => track.kind === 'video');
        if (videoTrack.enabled) {
            videoTrack.enabled = false;
            setShowVideo(true)
        } else {
            videoTrack.enabled = true;
            setShowVideo(false)
        }
    }

    const stopAudio = () => {
        const videoTrack = myStream.getTracks().find(track => track.kind === 'audio');
        if (videoTrack.enabled) {
            videoTrack.enabled = false;
            setShowAudio(true)
        } else {
            videoTrack.enabled = true;
            setShowAudio(false)
        }
    }

    const cleanupCall = async () => {
        if (isCleaningUp) return;
        setIsCleaningUp(true);

        try {
            // First, destroy peer connection
            if (connectionRef.current) {
                try {
                    if (!connectionRef.current.destroyed) {
                        connectionRef.current.destroy();
                    }
                } catch (err) {
                    console.error('Error destroying peer:', err);
                }
                connectionRef.current = null;
            }

            // Then, stop all media tracks
            if (myStream) {
                try {
                    const tracks = myStream.getTracks();
                    await Promise.all(tracks.map(track => {
                        if (track.readyState === 'live') {
                            return new Promise(resolve => {
                                track.onended = resolve;
                                track.stop();
                            });
                        }
                        return Promise.resolve();
                    }));
                } catch (err) {
                    console.error('Error stopping tracks:', err);
                }
                setMyStream(null);
            }

            // Clear video elements
            if (UserVideo.current) {
                try {
                    if (UserVideo.current.srcObject) {
                        const tracks = UserVideo.current.srcObject.getTracks();
                        tracks.forEach(track => {
                            try {
                                track.stop();
                            } catch (err) {
                                console.error('Error stopping track:', err);
                            }
                        });
                    }
                    UserVideo.current.srcObject = null;
                    UserVideo.current.onloadedmetadata = null;
                    UserVideo.current.onloadeddata = null;
                    UserVideo.current.oncanplay = null;
                } catch (err) {
                    console.error('Error clearing video element:', err);
                }
            }

            // Remove socket listeners
            socket.off('callAccepted');
            socket.off('callUser');
            socket.off('CallDisconnected');
            socket.off('CallDeclined');

            // Reset all states
            setCall({ isReceivingCall: false });
            setCallAccepted(false);
            setShowCalling(false);
            setCallDecline(false);
            pause();
            reset();

            // Finally, notify other peer
            socket.emit("hungUp", { to: chatId });
        } catch (err) {
            console.error('Error in cleanupCall:', err);
        } finally {
            setIsCleaningUp(false);
        }
    };

    const leaveCall = () => {
        if (isCleaningUp) {
            console.log('Still cleaning up, please wait...');
            return;
        }
        cleanupCall();
    };

    const handelDisconnect = () => {
        if (isCleaningUp) {
            console.log('Still cleaning up, please wait...');
            return;
        }
        cleanupCall();
    };

    useEffect(() => {
        socket.on('callUser', handelUserCall);
        socket.on("CallDisconnected", handelDisconnect);
        socket.on("CallDeclined", handelDecline);

        return () => {
            cleanupCall();
        };
    }, []);

    const HandelCall = async ({ videoCall }) => {
        if (isCleaningUp) {
            console.log('Still cleaning up, please wait...');
            return;
        }

        try {
            setShowCalling(true);
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: videoCall, audio: true });
            setMyStream(currentStream);
            
            const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });
            
            peer.on('signal', (data) => {
                if (peer.destroyed || isCleaningUp) return;
                let ref = JSON.stringify(UserData);
                socket.emit('callUser', { userToCall: chatId, signalData: data, userData: ref, videoCall: videoCall });
            });
            
            peer.on("stream", (currentStream) => {
                if (UserVideo.current && !isCleaningUp) {
                    try {
                        UserVideo.current.srcObject = currentStream;
                        UserVideo.current.onloadedmetadata = () => {
                            UserVideo.current.play().catch(err => console.error('Error playing video:', err));
                        };
                    } catch (err) {
                        console.error('Error setting stream:', err);
                    }
                }
                start();
            });
            
            peer.on('error', (err) => {
                console.error('Peer error:', err);
                cleanupCall();
            });

            peer.on('close', () => {
                cleanupCall();
            });
            
            socket.off('callAccepted');
            socket.on('callAccepted', ({ signal }) => {
                if (peer.destroyed || isCleaningUp) return;
                peer.signal(signal);
                setCallAccepted(true);
                setShowCalling(false);
            });
            
            connectionRef.current = peer;
        } catch (err) {
            console.error('Error in HandelCall:', err);
            cleanupCall();
        }
    };

    const handelUserCall = async ({ from, signal, videoCall }) => {
        setIsVideoCall(videoCall)
        audio.currentTime = 0
        audio.play()
        audio.loop = true
        let ref = JSON.parse(from)
        setCallFrom(ref)
        setCallDecline(false)
        setCall({ isReceivingCall: true, from: from, signal: signal });
    }

    const answerCall = async () => {
        if (!call.signal || isCleaningUp) {
            console.log('Cannot answer call: signal missing or still cleaning up');
            return;
        }
        
        try {
            reset();
            audio.pause();
            setCallAccepted(true);
            setShowCalling(false);
            
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: isVideoCall, audio: true });
            setMyStream(currentStream);
            
            const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });
            
            peer.on('signal', (data) => {
                if (peer.destroyed || isCleaningUp) return;
                socket.emit('answerCall', { signal: data, to: chatId });
                start();
            });
            
            peer.on("stream", (currentStream) => {
                if (UserVideo.current && !isCleaningUp) {
                    try {
                        UserVideo.current.srcObject = currentStream;
                        UserVideo.current.onloadedmetadata = () => {
                            UserVideo.current.play().catch(err => console.error('Error playing video:', err));
                        };
                    } catch (err) {
                        console.error('Error setting stream:', err);
                    }
                }
                setCall({ isReceivingCall: false });
            });
            
            peer.on('error', (err) => {
                console.error('Peer error:', err);
                leaveCall();
            });
            
            if (!peer.destroyed) {
                peer.signal(call.signal);
            }
            
            connectionRef.current = peer;
        } catch (err) {
            console.error('Error in answerCall:', err);
            leaveCall();
        }
    };

    const handelDecline = () => {
        setCallDecline(true)
    }

    const audioCall = () => {
        HandelCall({ videoCall: false });
        setIsVideoCall(false)
    }

    const callVideo = () => {
        HandelCall({ videoCall: true });
        setIsVideoCall(true)
    }

    const getChatSummary = async () => {
        if (!chatId) return;
        
        setIsLoadingSummary(true);
        setIsSummaryModalOpen(true);
        
        try {
            const response = await axios.post(
                `${BASE_URL}/api/chat/summarize`,
                { 
                    chatId,
                    days: summaryDays
                },
                config
            );
            
            setSummary(response.data.summary);
        } catch (error) {
            console.error('Error getting chat summary:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to generate summary. Please try again.';
            setSummary(`Error: ${errorMessage}`);
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const toggleSelectMessage = (messageId) => {
        setSelectedMessages((prev) =>
            prev.includes(messageId)
                ? prev.filter((id) => id !== messageId)
                : [...prev, messageId]
        );
    };

    const getTranslation = async (language) => {
        if (!chatId || selectedMessages.length === 0) return;
        setIsLoadingTranslation(true);
        setIsTranslationModalOpen(true);
        try {
            const response = await fetch(`${BASE_URL}/api/chat/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    chatId,
                    targetLanguage: language,
                    messageIds: selectedMessages,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setTranslatedText(data.translatedText);
            } else {
                toast.error(data.message || 'Failed to translate chat');
            }
        } catch (error) {
            console.error('Error translating chat:', error);
            toast.error('Failed to translate chat');
        } finally {
            setIsLoadingTranslation(false);
        }
    };

    const handleLanguageChange = (newLanguage) => {
        setTargetLanguage(newLanguage);
        getTranslation(newLanguage);
    };

    return (
        <div className={`relative flex w-full h-[100vh] ${Dark && 'dark'}`}>
            <div className="flex w-full overflow-hidden">
                <div className="w-full h-[100vh] flex flex-col relative">
                    <div className="w-full h-[9vh] dark:border-neutral-800 border-l-[1px] border-b-[1px] bg-[#F8FAFF] transition-colors dark:bg-[#111111] dark:text-neutral-200 flex items-center px-3 justify-between ">
                        <div className="flex space-x-3">
                            <div className="relative h-[2.2rem] w-[2.2rem]">
                                <img
                                    alt="ERROR"
                                    src={reciver.pic}
                                    className="w-[2.2rem] h-[2.2rem] object-cover rounded-full outline outline-theme outline-2"
                                />
                                {/* <div className="h-2 w-2 rounded-full bg-green-400 absolute right-0 bottom-0.5"></div> */}
                            </div>
                            <div className="flex flex-col">
                                <div className="text-sm capitalize">
                                    {data[0]?.chat.isGroupChat
                                        ? data[0].chat.chatName
                                        : reciver.name}
                                </div>
                                <div className="text-xs">{isTyping ? <div className="text-theme font-medium">Typing...</div> : "Online"}</div>
                            </div>
                        </div>
                        <div className="flex items-center ">
                            <div className="border-r-2 dark:border-neutral-8 transition-colors00 flex space-x-2 text-xl px-3 py-2">
                                <div className="transition-colors dark:hover:bg-neutral-800 hover:bg-neutral-200 px-3 py-2 rounded-md" onClick={!data[0]?.chat.isGroupChat ? audioCall : () => setCantCall(true)}>
                                    <IoCallOutline />
                                </div>
                                <div className="transition-colors dark:hover:bg-neutral-800 hover:bg-neutral-200 px-3 py-2 rounded-md" onClick={!data[0]?.chat.isGroupChat ? callVideo : () => setCantCall(true)}>
                                    <BsCameraVideo />
                                </div>
                                <div className="transition-colors dark:hover:bg-neutral-800 hover:bg-neutral-200 px-3 py-2 rounded-md" onClick={getChatSummary}>
                                    <MdSummarize />
                                </div>
                                <div className="transition-colors dark:hover:bg-neutral-800 hover:bg-neutral-200 px-3 py-2 rounded-md" onClick={selectedMessages.length > 0 ? getTranslation : undefined} style={{ opacity: selectedMessages.length > 0 ? 1 : 0.5, cursor: selectedMessages.length > 0 ? 'pointer' : 'not-allowed' }}>
                                    <MdTranslate />
                                </div>
                                <div className="transition-colors dark:hover:bg-neutral-800 hover:bg-neutral-200 px-3 py-2 rounded-md">
                                    <BiSearch />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="text-xl dark:hover:bg-neutral-800 hover:bg-neutral-200 rounded-md py-2 px-2 transition-colors" onClick={() => setMedia(!media)}>
                                    <FiChevronDown className={`${media && '-rotate-90 transition-all'}`} />
                                </div>
                                <div className="text-xl dark:hover:bg-neutral-800 hover:bg-neutral-200 rounded-md py-2 px-2 transition-colors" onClick={() => {
                                    localStorage.removeItem("token");
                                    localStorage.removeItem("userData");
                                    localStorage.removeItem("id");
                                    navigate("/");
                                }}>
                                    <FiLogOut />
                                </div>
                            </div>
                        </div>
                    </div>

                    {cantCall &&
                        <div className="absolute w-[22rem] h-[8rem] bg-white dark:bg-neutral-800 bottom-[40%] z-30 left-[35%] rounded-md flex flex-col items-center justify-center transition-colors">
                            <div className="font-medium dark:text-neutral-200 text-neutral-800 transition-colors">Group Calling is restricted as of now.</div>
                            <div className="bg-red-500 text-white cursor-pointer px-3 py-1 rounded-md mt-3" onClick={() => setCantCall(false)}>Close</div>
                        </div>
                    }

                    {showCalling &&
                        <div>
                            {callDecline ?
                                <div className="absolute w-[17rem] h-[15.58rem] rounded-2xl shadow-[0px_0px_10px_2px] shadow-neutral-300 dark:shadow-black top-[22px] right-5 dark:bg-neutral-900 transition-all bg-white z-20 flex flex-col pb-5">
                                    <div className="flex justify-between border-b transition-all border-neutral-300 dark:border-neutral-800 py-2 pl-2 pr-3">
                                        {isVideoCall ? 
                                        <div className="text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 justify-between">
                                            <div>📽️</div>
                                            <div className="text-xs mt-[1px]">Video Call</div>
                                        </div>:
                                        <div className="text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 justify-between">
                                            <div>🎙️</div>
                                            <div className="text-xs mt-[1px]">Audio Call</div>
                                        </div>
                                        }
                                        <div className="text-xs text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 cursor-pointer dark:hover:text-white" onClick={() => {
                                            setShowCalling(false)
                                            setCallDecline(false)
                                            setMyStream(myStream.getTracks().forEach(function (track) {
                                                track.stop();
                                            }))
                                        }}>
                                            <div>Close</div><RxCross2 size={10} className="mt-[1px]" />
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-center mt-4 ">
                                        {data[0]?.chat.users.map(item => ((item._id !== id) &&
                                            <div key={item._id} className="">
                                                <img alt="ERR" src={item.pic} className="w-[4rem] object-cover rounded-full h-[4rem]" />
                                                <div className="text-center text-md font-[400] transition-colors dark:text-neutral-200 mt-2 capitalize">{item.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center flex justify-center text-sm font-[400] transition-colors dark:text-neutral-200 space-x-1 ">
                                        <div>.......</div>
                                    </div>
                                    <div className="flex justify-center text-[14px] pt-1 mt-3">
                                        <div className="bg-red-600 text-white w-fit px-6 py-2 rounded-lg cursor-pointer" >Call Declined</div>
                                    </div>
                                </div>
                                :
                                <div className="absolute w-[17rem] h-[15.58rem] rounded-2xl shadow-[0px_0px_10px_2px] shadow-neutral-300 dark:shadow-black top-[22px] right-5 dark:bg-neutral-900 transition-all bg-white z-20 flex flex-col pb-5">
                                    <div className="flex justify-between border-b transition-all border-neutral-300 dark:border-neutral-800 py-2 pl-2 pr-3">
                                    {isVideoCall ?
                                        <div className="text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 justify-between">
                                            <div>📽️</div>
                                            <div className="text-xs mt-[1px]">Video Call</div>
                                        </div>
                                        :
                                        <div className="text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 justify-between">
                                            <div>🎙️</div>
                                            <div className="text-xs mt-[1px]">Audio Call</div>
                                        </div>
                                    }
                                        <div className="text-xs text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1">
                                            <div>Outgoing Call</div>
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-center mt-4 ">
                                        {data[0]?.chat.users.map(item => ((item._id !== id) &&
                                            <div key={item._id} className="">
                                                <img alt="ERR" src={item.pic} className="w-[4rem] object-cover rounded-full h-[4rem]" />
                                                <div className="text-center text-md font-[400] transition-colors dark:text-neutral-200 mt-2 capitalize">{item.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center flex justify-center text-sm font-[400] transition-colors dark:text-neutral-200 space-x-1 ">
                                        <div>Ringing</div>
                                    </div>
                                    <div className="flex justify-center text-[14px] pt-1 mt-3">
                                        <div className="bg-red-600 text-white w-fit px-6 py-2 rounded-lg cursor-pointer" onClick={() => {
                                            setShowCalling(false)
                                            setCallDecline(false)
                                            setMyStream(myStream.getTracks().forEach(function (track) {
                                                track.stop();
                                            }))
                                            socket.emit("DeclineCall", { to: chatId })
                                        }}>Cancel</div>
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    {/* {showCalling && 
                            <div className="absolute rounded-l-2xl right-[31.25rem] top-5 z-20 flex justify-center">
                                <div className="w-fit rounded-r-2xl overflow-hidden -scale-x-100">
                                <video muted ref={myVideo} className=' w-[334px] h-[249.5px]' autoPlay />
                                </div>
                            </div>
                        } */}

                    {call.isReceivingCall &&
                        <div>
                            {callDecline ?
                                <div className="absolute w-[17rem] h-[15.58rem] rounded-2xl shadow-[0px_0px_10px_2px] dark:shadow-black
                                dark:bg-neutral-900 transition-all shadow-neutral-300 top-5 right-5 bg-white z-20 flex flex-col">
                                    <div className="flex justify-between border-b transition-all border-neutral-300 dark:border-neutral-800 py-2 pl-2 pr-3">
                                    {isVideoCall ?
                                        <div className="text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 justify-between">
                                            <div>📽️</div>
                                            <div className="text-xs mt-[1px]">Video Call</div>
                                        </div>
                                        :
                                        <div className="text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 justify-between">
                                            <div>🎙️</div>
                                            <div className="text-xs mt-[1px]">Audio Call</div>
                                        </div>
                                    }
                                        <div className="text-xs text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 cursor-pointer hover:text-black dark:hover:text-white" onClick={() => {
                                            setCall({ isReceivingCall: false })
                                            setCallDecline(false)
                                            audio.pause()
                                        }}>
                                            <div>Close</div><RxCross2 size={10} className="mt-[1px]" 
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full flex flex-col items-center mt-4 ">
                                        <img alt="ERR" src={callFrom.pic} className="w-[5rem] object-cover rounded-full h-[5rem]" />
                                        <div className="text-center text-md font-[400] transition-colors dark:text-neutral-200 mt-2 capitalize">{callFrom.name}</div>
                                    </div>
                                    <div className="text-xs text-center mb-3 -mt-1 dark:text-neutral-200 text-neutral-700 transition-all">was calling you</div>
                                    <div className="flex justify-center text-[14px]">
                                        <div className="bg-red-600 text-neutral-100 w-fit px-5 py-2 rounded-md cursor-pointer">Call Missed</div>
                                    </div>

                                </div>
                                :
                                <div className="absolute w-[17rem] h-[15.58rem] rounded-2xl shadow-[0px_0px_10px_2px] shadow-neutral-300 dark:shadow-black top-5 right-5 dark:bg-neutral-900 transition-all bg-white z-20 flex flex-col">
                                    <div className="flex justify-between border-b transition-all border-neutral-300 dark:border-neutral-800 py-2 pl-2 pr-3">
                                    {isVideoCall ?
                                        <div className="text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 justify-between">
                                            <div>📽️</div>
                                            <div className="text-xs mt-[1px]">Video Call</div>
                                        </div>
                                        :
                                        <div className="text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 justify-between">
                                            <div>🎙️</div>
                                            <div className="text-xs mt-[1px]">Audio Call</div>
                                        </div>
                                    }
                                        <div className="text-xs text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 cursor-pointer hover:text-black dark:hover:text-white">
                                            <div>Incoming Call</div>
                                        </div>
                                    </div>
                                    <div className="w-full flex flex-col items-center mt-4 ">
                                        <img alt="ERR" src={callFrom.pic} className="w-[5rem] object-cover rounded-full h-[5rem]" />
                                        <div className="text-center text-md font-[400] transition-colors dark:text-neutral-200 mt-2 capitalize">{callFrom.name}</div>
                                    </div>
                                    <div className="text-xs text-center mb-3 -mt-1 dark:text-neutral-200 text-neutral-700 transition-all">is calling you</div>
                                    <div className="flex justify-center text-[14px]">
                                        <div className=" bg-red-600 text-white w-fit px-4 py-2 rounded-lg cursor-pointer flex items-center space-x-1" onClick={() => {
                                            audio.pause()
                                            setCall({ isReceivingCall: false })
                                            setCallDecline(false)
                                            socket.emit("DeclineCall", { to: chatId })
                                        }}>{<MdCallEnd />}
                                            <div>Decline</div></div>
                                        <div className=" bg-green-500 text-white ml-3 w-fit px-4 py-2 rounded-lg cursor-pointer flex items-center space-x-1" onClick={answerCall}>{<IoIosCall />}
                                            <div>Accept</div></div>
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    {/* {call.isReceivingCall && 
                            <div className="absolute rounded-l-2xl right-[31.25rem] top-5 z-20 flex justify-center">
                                <div className="w-fit rounded-r-2xl overflow-hidden -scale-x-100">
                                    <video muted ref={myVideo} className=' w-[334px] h-[249.5px]' autoPlay />
                                </div>
                            </div>
                        } */}

                    {/* Chat Area */}
                    <div className=" h-[82vh] flex flex-col border-l justify-end bg-[#F0F4FA] dark:border-neutral-800 transition-colors dark:bg-[#111111fd]">
                        <div className="overflow-y-auto w-full p-5 flex flex-col-reverse ">
                            {data.map((item, index) => (
                                <div key={item._id}>
                                    {getDate(item.createdAt) === getDate(data[index === data.length - 1 ? data.length - 1 : index + 1].createdAt) ? (
                                        <div></div>
                                    ) : (
                                        <ChatDay timeStamp={item.createdAt} />
                                    )}
                                    {item.sender._id === id ? (
                                        <MsgSent
                                            timeStamp={item.createdAt}
                                            message={item.content}
                                            messageId={item._id}
                                            selected={selectedMessages.includes(item._id)}
                                            onSelect={toggleSelectMessage}
                                        />
                                    ) : (
                                        <div>
                                            {item.chat.isGroupChat ? (
                                                <GroupMsg
                                                    data={data}
                                                    index={index}
                                                    sender={item.sender}
                                                    timeStamp={item.createdAt}
                                                    message={item.content}
                                                    messageId={item._id}
                                                    selected={selectedMessages.includes(item._id)}
                                                    onSelect={toggleSelectMessage}
                                                />
                                            ) : (
                                                <MsgReceived
                                                    timeStamp={item.createdAt}
                                                    message={item.content}
                                                    messageId={item._id}
                                                    selected={selectedMessages.includes(item._id)}
                                                    onSelect={toggleSelectMessage}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={sendMessage}>
                        <div className="w-full h-[9vh] border-l-2 dark:bg-[#111111] transition-colors dark:border-neutral-800 bg-[#F8FAFF] flex items-center px-4 z-10">
                            <div className="w-full px-4 flex items-center bg-black dark:bg-white dark:bg-opacity-10 bg-opacity-10 h-[2.5rem] rounded-lg dark:text-neutral-200">
                                {/* <img
                                            alt="ERROR"
                                            src="https://res.cloudinary.com/de2rges3m/image/upload/v1693508429/Chat%20App/Home%20Page/Link_vjmo8j.png"
                                            className="w-[1.5rem] h-[1.5rem] object-cover"
                                            /> */}
                                <input
                                    value={newMessage}
                                    className="outline-none bg-transparent w-full  placeholder:text-opacity-70"
                                    placeholder="Write a Message..."
                                    onChange={(e) => {
                                        setNewMessage(e.target.value)
                                        typingHandler()
                                    }}
                                    onClick={() => setShowEmoji(false)}
                                    readOnly={isSending ? true : false}
                                />
                                <div>
                                    <HiOutlineFaceSmile size={24} className="text-neutral-700 dark:text-neutral-300 bg-opacity-70" onClick={() => setShowEmoji(!showEmoji)} />
                                    {showEmoji && 
                                    <div>
                                    <div className="absolute w-full top-0 left-0 h-[91vh] z-0" onClick={() => setShowEmoji(false)}></div>
                                    <div className="fixed bottom-[5rem] right-[1.3rem] z-20"><EmojiPicker emojiStyle="native" width={350} height={450} onEmojiClick={(e) => setNewMessage(old => old + e.emoji)}/></div>
                                    </div>}
                                </div>
                            </div>
                            <button className="w-[6.5rem] h-[2.5rem] ml-4 flex items-center justify-center rounded-lg bg-theme text-white">
                                <div>
                                    Send
                                </div>
                            </button>
                        </div>
                    </form>
                </div>
                <RightSlider
                    media={media}
                    reciver={reciver}
                    name={data[0]?.chat.isGroupChat ? data[0].chat.chatName : reciver.name}
                    data={data[0]?.chat.isGroupChat ? data[0].chat.users : ''}
                    isGroupChat={data[0]?.chat.isGroupChat ? true : false}
                    chatId={chatId}
                />
            </div>

            {callAccepted &&
                <>
                    {isVideoCall ?
                        <div className="absolute w-full h-full backdrop-blur-md bg-opacity-50 z-50 flex items-center">
                            <div className="w-fit rounded-lg overflow-hidden ml-3 -scale-x-100">
                                <video 
                                    ref={UserVideo} 
                                    className='w-[55rem]' 
                                    autoPlay 
                                    playsInline 
                                    muted
                                    onError={(e) => {
                                        console.error('Video error:', e);
                                        cleanupCall();
                                    }}
                                />
                            </div>

                            <div className="flex-1 h-full flex flex-col justify-between">
                                <div className="flex flex-col pt-7 px-5 text-white space-y-4">
                                    <div className={`w-full flex justify-center bg-opacity-70 ${!showVideo ? 'bg-theme' : 'bg-red-500'} py-2 rounded-md`} onClick={stopVideo}>
                                        {!showVideo ?
                                            <div className="flex items-center">
                                                <BiVideoOff className="text-lg mr-2" />
                                                Stop Video
                                            </div>
                                            :
                                            <div className="flex items-center">
                                                <BiVideo className="text-lg mr-2" />
                                                Start Video
                                            </div>
                                        }
                                    </div>
                                    <div className={`w-full flex justify-center bg-opacity-70 ${!showAudio ? 'bg-theme' : 'bg-red-500'} py-2 rounded-md`} onClick={stopAudio}>{!showAudio ?
                                        <div className="flex items-center">
                                            <AiOutlineAudioMuted className="text-lg mr-2" />
                                            Mute
                                        </div>
                                        :
                                        <div className="flex items-center">
                                            <AiOutlineAudio className="text-lg mr-2" />
                                            Unmute
                                        </div>
                                    }</div>
                                    <div className="w-full text-center bg-red-500 bg-opacity-70 py-2 rounded-md" onClick={leaveCall}>End Call</div>
                                </div>
                                <div className="h-fit px-5">
                                    <div className="my-7 rounded-md overflow-hidden -scale-x-100">
                                        {myStream && (
                                            <video
                                                autoPlay
                                                playsInline
                                                muted
                                                style={{ width: '210px', height: '157px' }}
                                                ref={video => {
                                                    if (video) {
                                                        video.srcObject = myStream;
                                                    }
                                                }}
                                                onError={(e) => {
                                                    console.error('Local video error:', e);
                                                    cleanupCall();
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        :
                        <div className="absolute w-[17rem] h-[15.58rem] rounded-xl shadow-[0px_0px_10px_2px] shadow-neutral-300 dark:shadow-black top-5 right-5 dark:bg-neutral-900 transition-all bg-white z-20 flex flex-col">
                            <video 
                                ref={UserVideo} 
                                className='w-0' 
                                autoPlay 
                                playsInline 
                                muted
                                onError={(e) => {
                                    console.error('Video error:', e);
                                    cleanupCall();
                                }}
                            />
                            {myStream && (
                                <video
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '0px', height: '0px' }}
                                    ref={video => {
                                        if (video) {
                                            video.srcObject = myStream;
                                        }
                                    }}
                                    onError={(e) => {
                                        console.error('Local video error:', e);
                                        cleanupCall();
                                    }}
                                />
                            )}
                            <div className="flex justify-between border-b transition-all border-neutral-300 dark:border-neutral-800 py-2 pl-2 pr-3">
                                <div className="text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 justify-between">
                                    <div>🎙️</div>
                                    <div className="text-xs mt-[1px]">Audio Call</div>
                                </div>
                                <div className="text-xs text-neutral-800 transition-all dark:text-neutral-200 flex items-center space-x-1 cursor-pointer hover:text-black dark:hover:text-white" onClick={() => {
                                    setCall({ isReceivingCall: false })
                                    setCallDecline(false)
                                }}>
                                    <div>{minutes}:{seconds}</div>
                                </div>
                            </div>
                            {data[0]?.chat.users.map(item => ((item._id !== id) &&
                                <div key={item._id} className="flex flex-col items-center mt-4">
                                    <img alt="ERR" src={item.pic} className="w-[4rem] object-cover rounded-full h-[4rem]" />
                                    <div className="text-center text-md font-[400] transition-colors dark:text-neutral-200 mt-2 capitalize">{item.name}</div>
                                </div>
                            ))}
                            <div className="text-center dark:text-neutral-200 transition-all text-xs">Connected!</div>
                            <div className="flex items-center justify-center mt-4 w-full space-x-3  ">
                                <div className="text-[14px]" onClick={leaveCall}>
                                    <div className=" bg-red-600 text-white w-fit px-4 py-2 rounded-lg cursor-pointer flex items-center space-x-1">{<MdCallEnd />}
                                        <div className="select-none"> End call</div></div>
                                </div>
                                <div className={`w-fit px-2 flex justify-center ${!showAudio ? 'bg-theme' : 'bg-red-600'} py-2 rounded-lg text-neutral-200 transition-all`} onClick={stopAudio}>{!showAudio ?
                                    <div className="flex items-center">
                                        <AiOutlineAudio className="text-[21px]" />
                                    </div>
                                    :
                                    <div className="flex items-center">
                                        <AiOutlineAudioMuted className="text-[21px]"/>
                                    </div>
                                }</div>
                            </div>
                        </div>
                    }
                </>
            }

            <SummaryModal
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                summary={summary}
                isLoading={isLoadingSummary}
                onDaysChange={(days) => {
                    setSummaryDays(days);
                    getChatSummary();
                }}
            />
            
            <TranslationModal
                isOpen={isTranslationModalOpen}
                onClose={() => setIsTranslationModalOpen(false)}
                translatedText={translatedText}
                isLoading={isLoadingTranslation}
                onLanguageChange={handleLanguageChange}
            />
        </div>
    );
};

export default MainContainer;

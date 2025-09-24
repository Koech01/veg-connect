import moment from 'moment';
import React, { useState } from 'react';
import css from '../Forum/index.module.css';
import { type MessageProps, type ProfileProps, type GroupProps, getMessageFileFormat, formatTaskDate } from '../types/index';


interface ForumInboxMessagesProps {
  messages       : MessageProps[];
  profile        : ProfileProps;
  chatDetails    : ProfileProps | GroupProps | null;
  selectedChatId : number | null;
  onMediaClick   : (fileUrl: string, fileType: 'image' | 'video') => void;
  chatEndRef     : React.RefObject<HTMLDivElement | null>;
}


const ForumInboxMessages: React.FC<ForumInboxMessagesProps> = ({ 
    messages, 
    profile, 
    chatDetails, 
    selectedChatId,
    onMediaClick,
    chatEndRef 
}) => {
    const [clickedMsgFileId, setClickedMsgFileId] = useState<number | null>(null);

    function isProfileProps(details: ProfileProps | GroupProps | null): details is ProfileProps {
        return (details as ProfileProps)?.profile !== undefined;
    }


    const handleMessageFileClick = (messageId: number) => { setClickedMsgFileId(messageId); };

    
  return (
    <div className={css.forumInboxMessagesDiv}>

        {!chatDetails && !selectedChatId ? (
            <div className={`${css.forumNoMessagesDiv} ${profile.profile.displayTheme === 'dark' ? css.darkTheme : css.lightTheme}`}></div>
        ) : chatDetails && selectedChatId && (!messages || messages.length === 0) ? (
            <></>
        ) : (
            messages.map((message) => (
                <>
                {/* receiver text message */}
                {(
                    message.text && message.files.length === 0 && !message.task && !message.plant &&
                    (
                    (
                        message.sender.username    === (isProfileProps(chatDetails) ? chatDetails.profile.username : '') &&
                        message.receiver?.username === profile.profile.username
                    ) 
                    || 
                    (
                        message.group?.name     === (!isProfileProps(chatDetails) ? chatDetails?.name : '') &&
                        message.sender.username !== profile.profile.username
                    )
                    )
                    ) && (
                    <div className={`${css.forumMsgReceiverDiv} ${css.fadeIn}`} key={message.id}>
                        <div className={css.forumMsgPeerChildDiv}>
                            <img className={css.forumMsgPeerIcon} src={message.sender.profileIcon} alt="forum-chat-user-icon"/>
                            <p className={css.forumMsgPeerUsername}>{message.sender.username}</p>
                            <p className={css.forumMsgPeerCreated}>
                            {moment.utc(message.created).local().startOf('seconds').fromNow()}
                            </p>
                        </div>

                        <div className={css.forumMsgPeerContentDiv}>
                            <p className={css.forumPeerMsgText}>{message.text}</p>
                        </div>
                    </div>
                )}


                {/* receiver text and media */}
                {(
                    message.files.length > 0 && !message.task && !message.plant &&    
                    (
                    (
                        message.sender.username    === (isProfileProps(chatDetails) ? chatDetails.profile.username : '') &&
                        message.receiver?.username === profile.profile.username
                    ) 
                    || 
                    (
                        message.group?.name     === (!isProfileProps(chatDetails) ? chatDetails?.name : '') &&
                        message.sender.username !== profile.profile.username
                    )
                    )
                    ) && (
                    <div className={`${css.forumMsgReceiverDiv} ${css.fadeIn}`} key={message.id}>
                        <div className={css.forumMsgPeerChildDiv}>
                            <img className={css.forumMsgPeerIcon} src={message.sender.profileIcon} alt="forum-chat-user-icon"/>
                            <p className={css.forumMsgPeerUsername}>{message.sender.username}</p>
                            <p className={css.forumMsgPeerCreated}> 
                            {moment.utc(message.created).local().startOf('seconds').fromNow()}
                            </p>
                        </div>

                        {message.files.length === 1 && (
                            <div className={css.forumPeerSingleImageDiv}>
                                {getMessageFileFormat(`${message.files[0].file}`) === 'image' && (
                                    <img 
                                        alt       = "forum-peer-file-0"
                                        src       = {message.files[0].file} 
                                        className = {`${css.forumAuthorMsgImg} ${css.peerSingle}`} 
                                        onClick   = {() => onMediaClick(message.files[0].file, 'image')}
                                    />
                                )}

                                {getMessageFileFormat(`${message.files[0].file}`) === 'video' && (
                                    <video
                                        controls
                                        className = {`${css.forumAuthorMsgImg} ${css.peerSingle}`} 
                                        onClick   = {() => onMediaClick(message.files[0].file, 'video')}
                                        >
                                        <source src={message.files[0].file}/>Your browser does not support the video tag. 
                                    </video>
                                )}
                            </div>
                        )}
                        
                        {message.files.length === 2 && (
                            <div 
                                className = {`${clickedMsgFileId === message.id ? css.forumReceiverMsgMediaDiv : css.forumPeerMsgDoubleImageDiv}`} 
                                onClick   = {() => handleMessageFileClick(message.id)}
                            >
                                {[0, 1].map((index) => (
                                    getMessageFileFormat(`${message.files[index].file}`) === 'image' ? ( 
                                        <img 
                                            alt       = {`forum-peer-file ${-index}`}
                                            src       = {message.files[index].file} 
                                            onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(message.files[index].file, 'image'); } }}
                                            className = {`
                                                ${css.forumAuthorMsgImg} 
                                                ${clickedMsgFileId === message.id ? css.userMediaClickedImg : index === 0 ? css.peerDoubleOne : css.peerDoubleTwo}
                                            `} 
                                        />
                                    ): getMessageFileFormat(`${message.files[index].file}`) === 'video' ? (
                                        <video
                                            controls
                                            className = {
                                                clickedMsgFileId === message.id ?
                                                `${css.userMediaClickedVid}` 
                                                : 
                                                `
                                                ${css.forumInboxMsgVid}
                                                ${css.forumAuthorMsgImg} 
                                                ${index === 0 ? css.peerDoubleOne : css.peerDoubleTwo}
                                                `
                                            }
                                            onClick={() => { if (clickedMsgFileId === message.id) { onMediaClick(message.files[index].file, 'video'); } }}
                                        >
                                            <source src={message.files[index].file}/>Your browser does not support the video tag. 
                                        </video>
                                    ) : null 
                                ))}
                            </div>
                        )}

                        {message.files.length === 3 && (
                            <div 
                                className = {`${clickedMsgFileId === message.id ? css.forumReceiverMsgMediaDiv : css.forumPeerMsgTripleImageDiv}`} 
                                onClick   = {() => handleMessageFileClick(message.id)}
                            >
                                {[0, 1, 2].map((index) => {
                                    const forumAuthorMsgFileCss = `
                                        ${clickedMsgFileId === message.id ? css.userMediaClickedImg : index === 0 ? css.peerTripleOne : index === 1 ? css.peerTripleTwo : css.peerTripleThree}
                                    `;

                                    return getMessageFileFormat(`${message.files[index].file}`) === 'image' ? (
                                    <img 
                                        alt       = {`forum-peer-file ${-index}`}
                                        src       = {message.files[index].file} 
                                        className = {`${css.forumAuthorMsgImg} ${forumAuthorMsgFileCss}`}
                                        onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(message.files[index].file, 'image'); } }}
                                    />
                                    ) : getMessageFileFormat(`${message.files[index].file}`) === 'video' ? (
                                    <video 
                                        controls 
                                        key       = {index} 
                                        className = {clickedMsgFileId === message.id ? `${css.userMediaClickedVid}` : `${css.forumInboxMsgVid} ${forumAuthorMsgFileCss}`}
                                        onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(message.files[index].file, 'video'); } }}
                                    >
                                        <source src={message.files[index].file}/>Your browser does not support the video tag.
                                    </video>
                                    ) : null
                                })}
                            </div>
                        )}

                        {message.files.length > 3 && (
                            <div 
                                className = {`${clickedMsgFileId === message.id ? css.forumReceiverMsgMediaDiv : css.forumPeerMultiImageDiv}`} 
                                onClick   = {() => handleMessageFileClick(message.id)}
                            >
                                {message.files.slice(0, 4).map((file, index) => (
                                    getMessageFileFormat(file.file) === 'image' ? (
                                    <img 
                                        key       = {index} 
                                        src       = {file.file} 
                                        alt       = {`forum-peer-file-${index}`} 
                                        className = {`${clickedMsgFileId === message.id ? css.userMediaClickedImg : css.forumPeerStackedImage}`} 
                                        onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(file.file, 'image'); } }}
                                    />
                                    ) : (
                                    <video 
                                        controls 
                                        key       = {index}  
                                        className = {clickedMsgFileId === message.id ? `${css.userMediaClickedVid}` : `${css.forumPeerStackedImage} ${css.forumInboxMsgVid}`}
                                        onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(file.file, 'video'); } }}
                                    >
                                        <source src={file.file}/>Your browser does not support the video tag.
                                    </video>
                                    )
                                ))}
                            </div>
                        )}

                        {message.text && (
                            <div className={`${css.forumMsgReceiverDiv} ${css.fadeIn}`} key={message.id}>
                                <div className={css.forumMsgPeerContentDiv}>
                                    <p className={css.forumPeerMsgQuotedText}>{message.text}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}


               {/* receiver task and text message */}
               {(
                    message.task && message.files.length === 0 && !message.plant &&
                    (
                    (
                        message.sender.username    === (isProfileProps(chatDetails) ? chatDetails.profile.username : '') &&
                        message.receiver?.username === profile.profile.username
                    ) 
                    || 
                    (
                        message.group?.name     === (!isProfileProps(chatDetails) ? chatDetails?.name : '') &&
                        message.sender.username !== profile.profile.username
                    )
                    )
                    ) && (
                    <div className={`${css.forumMsgReceiverDiv} ${css.fadeIn}`} key={message.id}>
                        <div className={css.forumMsgPeerChildDiv}>
                            <img className={css.forumMsgPeerIcon} src={message.sender.profileIcon} alt="forum-chat-user-icon"/>
                            <p className={css.forumMsgPeerUsername}>{message.sender.username}</p>
                            <p className={css.forumMsgPeerCreated}>
                            {moment.utc(message.created).local().startOf('seconds').fromNow()}
                            </p>
                        </div>

                        <div className={css.forumMsgPeerContentDiv}>
                            <div className={`${css.forumMessageTaskDiv} ${css.forumMessageReceiverTaskDiv}`}>
                                <p className={css.forumMessageTaskHeader}>{message.task.title}</p>
                                <p className={css.forumMessageTaskDate}>created&nbsp;.&nbsp;{formatTaskDate(message.task.created)}</p>
                                <p className={css.forumMessageTaskText}>{message.task.description}</p>
                            </div>
                        </div>

                        {message.text && (
                            <div className={css.forumMsgPeerContentDiv}>
                                <p className={css.forumPeerMsgText}>{message.text}</p>
                            </div>
                        )}
                    </div>
                )}


               {/* receiver plant and text message */}
               {(
                    message.plant && message.files.length === 0 && !message.task &&
                    (
                    (
                        message.sender.username    === (isProfileProps(chatDetails) ? chatDetails.profile.username : '') &&
                        message.receiver?.username === profile.profile.username
                    ) 
                    || 
                    (
                        message.group?.name     === (!isProfileProps(chatDetails) ? chatDetails?.name : '') &&
                        message.sender.username !== profile.profile.username
                    )
                    )
                    ) && (
                    <div className={`${css.forumMsgReceiverDiv} ${css.fadeIn}`} key={message.id}>
                        <div className={css.forumMsgPeerChildDiv}>
                            <img className={css.forumMsgPeerIcon} src={message.sender.profileIcon} alt="forum-chat-user-icon"/>
                            <p className={css.forumMsgPeerUsername}>{message.sender.username}</p>
                            <p className={css.forumMsgPeerCreated}>
                            {moment.utc(message.created).local().startOf('seconds').fromNow()}
                            </p>
                        </div>

                        <div className={css.forumMsgPeerContentDiv}>
                            <div className={`${css.forumMessageTaskDiv} ${css.forumMessageReceiverTaskDiv}`}> 
                                <p className={css.forumMessageTaskHeader}>{message.plant.commonName}</p>
                                <p className={css.forumMessageTaskDate}>Scientific Name<p className={css.forumPlantSectionValue}>{message.plant.scientificName}</p></p>

                                <div className={css.forumPlantSectionDiv}>  
                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>Plant Information</p>
                                    </div>
                                    
                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>
                                            Family 
                                            <p className={css.forumPlantSectionValue}>{message.plant.family}</p>
                                        </p> 
                                    </div>

                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>
                                            Life Cycle 
                                            <p className={css.forumPlantSectionValue}>{message.plant.lifeCycles.join(', ')}</p>
                                        </p> 
                                    </div>

                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>
                                            Height 
                                            <p className={css.forumPlantSectionValue}>{message.plant.height} m</p> 
                                        </p> 
                                    </div>

                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>
                                            Width 
                                            <p className={css.forumPlantSectionValue}>{message.plant.width} m</p>
                                        </p> 
                                    </div>
                                </div>

                                <div  className={css.forumPlantSectionDiv}>  
                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>Growth Conditions</p>
                                    </div>

                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>
                                            Soil pH 
                                            <p className={css.forumPlantSectionValue}>{message.plant.soilPH}</p>
                                        </p> 
                                    </div>

                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>
                                            Soil Type 
                                            <p className={css.forumPlantSectionValue}>{message.plant.soilTypes.join(', ')}</p>
                                        </p> 
                                    </div>

                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>
                                            Light Requirement 
                                            <p className={css.forumPlantSectionValue}>{message.plant.lightRequirements.join(', ')}</p> 
                                        </p> 
                                    </div>

                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>
                                            USDA Hardiness Zone 
                                            <p className={css.forumPlantSectionValue}>{message.plant.usdaHardinessZone}</p>
                                        </p> 
                                    </div>
                                </div>

                                <div className={css.forumPlantSectionDiv}>  
                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>Utility | Use</p>
                                    </div>

                                    {
                                        (Array.isArray(message.plant.utility)
                                        ? message.plant.utility
                                        : (message.plant.utility as string).split(',')
                                        )
                                        .map((name: string) => name.trim())
                                        .filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index)
                                        .sort((a: string, b: string) => a.localeCompare(b))
                                        .map((name: string, index: number) => {
                                            const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
                                            return <li className={css.forumMessagePlantListItem} key={`alternateName-${index}`}>{index + 1}. {capitalized}</li>;
                                        })
                                    }
                                </div>
 
                                <div className={css.forumPlantSectionDiv}>  
                                    <div className={css.forumPlantSectionTextDiv}>
                                        <p className={css.forumMessageTaskDate}>Alternate Names</p>
                                    </div>

                                    {
                                        (Array.isArray(message.plant.alternateNames)
                                        ? message.plant.alternateNames
                                        : (message.plant.alternateNames as string).split(',')
                                        )
                                        .map((name: string) => name.trim())
                                        .filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index)
                                        .sort((a: string, b: string) => a.localeCompare(b))
                                        .map((name: string, index: number) => {
                                            const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
                                            return <li className={css.forumMessagePlantListItem} key={`alternateName-${index}`}>{index + 1}. {capitalized}</li>;
                                        })
                                    }
                                </div>
                            </div>
                        </div>

                        {message.text && (
                            <div className={css.forumMsgPeerContentDiv}>
                                <p className={css.forumPeerMsgText}>{message.text}</p>
                            </div>
                        )}
                    </div>
                )}
 

                {/* profile text message */}
                {(
                    message.text && message.files.length === 0 && !message.task && !message.plant &&
                (
                    (
                    message.user?.username     === profile.profile.username &&
                    message.sender.username    === profile.profile.username &&
                    message.receiver?.username === (isProfileProps(chatDetails) ? chatDetails.profile.username : '') 
                    ) 
                    || 
                    (
                    message.group?.name     === (!isProfileProps(chatDetails) ? chatDetails?.name : '') &&
                    message.sender.username === profile.profile.username
                    )
                )
                ) && (
                    <div className={`${css.forumAuthorTextMsgDiv} ${css.fadeIn}`} key={message.id}>
                        <p className={css.forumAuthorTextMsgText}>{message.text}</p>
                        <p className={css.forumAuthorTextMsgCreated}>
                            {moment.utc(message.created).local().startOf('seconds').fromNow()}
                        </p>
                    </div>
                )}


                {/* profile text and media message */}
                {(
                    message.files.length > 0 && !message.task && !message.plant && 
                    (
                    (
                        message.user?.username     === profile.profile.username &&
                        message.sender.username    === profile.profile.username &&
                        message.receiver?.username === (isProfileProps(chatDetails) ? chatDetails.profile.username : '') 
                    ) 
                    || 
                    (
                        message.group?.name     === (!isProfileProps(chatDetails) ? chatDetails?.name : '') &&
                        message.sender.username === profile.profile.username
                    )
                    )
                ) && (
                    <div className={`${css.forumAuthorMsgImageDiv} ${css.fadeIn}`} key={message.id}>
                        {message.files.length === 1 && (
                            <div className={css.forumAuthorMsgSingleImageDiv}>
                                {getMessageFileFormat(`${message.files[0].file}`) === 'image' && (
                                    <img 
                                        alt       = "forum-author-file-0"
                                        src       = {message.files[0].file} 
                                        className = {`${css.forumAuthorMsgImg} ${css.singleImage}`} 
                                        onClick   = {() => onMediaClick(message.files[0].file, 'image')}
                                    />
                                )}

                                {getMessageFileFormat(`${message.files[0].file}`) === 'video' && (
                                    <video
                                        controls
                                        className = {`${css.forumAuthorMsgImg} ${css.singleImage}`} 
                                        onClick   = {() => onMediaClick(message.files[0].file, 'video')}
                                    >
                                    <source src={message.files[0].file}/>Your browser does not support the video tag. 
                                    </video>
                                )}
                            </div>
                        )}

                        {message.files.length === 2 && (
                            <div 
                                className = {`${clickedMsgFileId === message.id ? css.forumReceiverMsgMediaDiv : css.forumAuthorMsgDoubleImageDiv}`} 
                                onClick   = {() => handleMessageFileClick(message.id)}
                            >

                            {[0, 1].map((index) => (
                                getMessageFileFormat(`${message.files[index].file}`) === 'image' ? ( 
                                <img 
                                    src       = {message.files[index].file} 
                                    alt       = {`forum-author-file ${-index}`}
                                    onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(message.files[index].file, 'image'); } }}
                                    className = {`
                                        ${css.forumAuthorMsgImg} 
                                        ${clickedMsgFileId === message.id ? css.userMediaClickedImg : index === 0 ? css.authorDoubleOne : css.authorDoubleTwo}
                                    `} 

                                />
                                ): getMessageFileFormat(`${message.files[index].file}`) === 'video' ? (
                                <video
                                    controls
                                    className = {
                                        clickedMsgFileId === message.id ?
                                        `${css.userMediaClickedVid}` 
                                        : 
                                        `
                                        ${css.forumInboxMsgVid}
                                        ${css.forumAuthorMsgImg} 
                                        ${index === 0 ? css.authorDoubleOne : css.authorDoubleTwo}
                                        `
                                    }
                                    onClick={() => { if (clickedMsgFileId === message.id) { onMediaClick(message.files[index].file, 'video'); } }}
                                >
                                    <source src={message.files[index].file}/>Your browser does not support the video tag. 
                                </video>
                                ) : null 
                            ))}
                            </div>
                        )}

                        {message.files.length === 3 && (
                            <div 
                                className = {`${clickedMsgFileId === message.id ? css.forumReceiverMsgMediaDiv : css.forumAuthorMsgTripleImageDiv}`} 
                                onClick   = {() => handleMessageFileClick(message.id)}
                            >

                            {[0, 1, 2].map((index) => {
                                const forumAuthorMsgFileCss = `
                                    ${clickedMsgFileId === message.id ? css.userMediaClickedImg : index === 0 ? css.authorTripleOne : index === 1 ? css.authorTripleTwo : css.authorTripleThree}
                                `;

                                return getMessageFileFormat(`${message.files[index].file}`) === 'image' ? (
                                    <img 
                                        alt       = {`forum-author-file ${-index}`}
                                        src       = {message.files[index].file} 
                                        className = {`${css.forumAuthorMsgImg} ${forumAuthorMsgFileCss}`}
                                        onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(message.files[index].file, 'image'); } }}
                                    />
                                    ) : getMessageFileFormat(`${message.files[index].file}`) === 'video' ? (
                                    <video 
                                        controls 
                                        key       = {index} 
                                        className = {clickedMsgFileId === message.id ? `${css.userMediaClickedVid}` : `${css.forumInboxMsgVid} ${forumAuthorMsgFileCss}`}
                                        onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(message.files[index].file, 'video'); } }}
                                    >
                                        <source src={message.files[index].file}/>Your browser does not support the video tag.
                                    </video>
                                ) : null

                            })}
                            </div>
                        )}

                        {message.files.length > 3 && (
                            <div 
                                className = {`${clickedMsgFileId === message.id ? css.forumReceiverMsgMediaDiv : css.forumAuthorMsgMultiImageDiv}`} 
                                onClick   = {() => handleMessageFileClick(message.id)}
                            >
                            {message.files.slice(0, 4).map((file, index) => (
                                getMessageFileFormat(file.file) === 'image' ? (
                                <img 
                                    key       = {index} 
                                    src       = {file.file} 
                                    alt       = {`forum-peer-author-${index}`} 
                                    className = {`${clickedMsgFileId === message.id ? css.userMediaClickedImg : css.forumAuthorStackedImage}`} 
                                    onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(file.file, 'image'); } }}
                                />
                                ) : (
                                <video 
                                    controls 
                                    key       = {index}  
                                    className = {clickedMsgFileId === message.id ? `${css.userMediaClickedVid}` : `${css.forumAuthorStackedImage} ${css.forumInboxMsgVid}`}
                                    onClick   = {() => { if (clickedMsgFileId === message.id) { onMediaClick(file.file, 'video'); } }}
                                >
                                    <source src={file.file}/>Your browser does not support the video tag.
                                </video>
                                )
                            ))}
                            </div>
                        )}

                        {message.text ? (
                            <div className={`${css.forumAuthorTextAndMediaMsgDiv} ${css.fadeIn}`} key={message.id}>
                                <p className={css.forumAuthorTextMsgText}>{message.text}</p>
                                <p className={css.forumAuthorTextMsgCreated}>
                                    {moment.utc(message.created).local().startOf('seconds').fromNow()}
                                </p>
                            </div>
                        ) : (
                            <p className={css.forumAuthorImageMsgCreated}>
                                {moment.utc(message.created).local().startOf('seconds').fromNow()}
                            </p>
                        )}
                    </div>
                )}

   
                {/* profile task and text message*/}
                {(
                    message.task && message.files.length === 0 && !message.plant &&
                (
                    (
                    message.user?.username     === profile.profile.username &&
                    message.sender.username    === profile.profile.username &&
                    message.receiver?.username === (isProfileProps(chatDetails) ? chatDetails.profile.username : '') 
                    ) 
                    || 
                    (
                    message.group?.name     === (!isProfileProps(chatDetails) ? chatDetails?.name : '') &&
                    message.sender.username === profile.profile.username
                    )
                )
                ) && (
                    <div className={`${css.forumAuthorTextMsgDiv} ${css.fadeIn}`} key={message.id}>
                        <div className={`${css.forumMessageTaskDiv} ${css.forumMessageProfileTaskDiv}`}>
                            <p className={css.forumMessageTaskHeader}>{message.task.title}</p>
                            <p className={css.forumMessageTaskDate}>created&nbsp;.&nbsp;{formatTaskDate(message.task.created)}</p>
                            <p className={css.forumMessageTaskText}>{message.task.description}</p>
                        </div>

                        {message.text && (
                            <p className={css.forumAuthorMediaMsgText}>{message.text}</p>
                        )}

                        <p className={css.forumAuthorTextMsgCreated}>
                            {moment.utc(message.created).local().startOf('seconds').fromNow()}
                        </p>
                    </div>
                )}

                {/* profile plant and text message */}
                {(
                    message.plant && message.files.length === 0 && !message.task &&
                (
                    (
                    message.user?.username     === profile.profile.username &&
                    message.sender.username    === profile.profile.username &&
                    message.receiver?.username === (isProfileProps(chatDetails) ? chatDetails.profile.username : '') 
                    ) 
                    || 
                    (
                    message.group?.name     === (!isProfileProps(chatDetails) ? chatDetails?.name : '') &&
                    message.sender.username === profile.profile.username
                    )
                )
                ) && (
                    <div className={`${css.forumAuthorTextMsgDiv} ${css.fadeIn}`} key={message.id}>
                        <div className={`${css.forumMessageTaskDiv} ${css.forumMessageProfileTaskDiv}`}>

                            <p className={css.forumMessageTaskHeader}>{message.plant.commonName}</p>
                            <p className={css.forumMessageTaskDate}>Scientific Name <p className={css.forumPlantSectionValue}>{message.plant.scientificName}</p></p>

                            <div  className={css.forumPlantSectionDiv}>  
                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>Plant Information</p>
                                </div>
                                
                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>
                                        Family 
                                        <p className={css.forumPlantSectionValue}>{message.plant.family}</p>
                                    </p> 
                                </div>

                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>
                                        Life Cycle 
                                        <p className={css.forumPlantSectionValue}>{message.plant.lifeCycles.join(', ')}</p>
                                    </p> 
                                </div>
                                
                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>
                                        Height 
                                        <p className={css.forumPlantSectionValue}>{message.plant.height} m</p> 
                                    </p> 
                                </div>

                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>
                                        Width 
                                        <p className={css.forumPlantSectionValue}>{message.plant.width} m</p>
                                    </p> 
                                </div>
                            </div>

                            <div  className={css.forumPlantSectionDiv}>  
                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>Growth Conditions</p>
                                </div>
                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>
                                        Soil pH 
                                        <p className={css.forumPlantSectionValue}>{message.plant.soilPH}</p>
                                    </p> 
                                </div>

                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>
                                        Soil Type 
                                        <p className={css.forumPlantSectionValue}>{message.plant.soilTypes.join(', ')}</p>
                                    </p> 
                                </div>

                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>
                                        Light Requirement 
                                        <p className={css.forumPlantSectionValue}>{message.plant.lightRequirements.join(', ')}</p> 
                                    </p> 
                                </div>

                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>
                                        USDA Hardiness Zone 
                                        <p className={css.forumPlantSectionValue}>{message.plant.usdaHardinessZone}</p>
                                    </p> 
                                </div>
                            </div> 

                            <div className={css.forumPlantSectionDiv}>  
                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>Utility | Use</p>
                                </div>

                                {
                                    (Array.isArray(message.plant.utility)
                                    ? message.plant.utility
                                    : (message.plant.utility as string).split(',')
                                    )
                                    .map((name: string) => name.trim())
                                    .filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index)
                                    .sort((a: string, b: string) => a.localeCompare(b))
                                    .map((name: string, index: number) => {
                                        const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
                                        return <li className={css.forumMessagePlantListItem} key={`alternateName-${index}`}>{index + 1}. {capitalized}</li>;
                                    })
                                }
                            </div>


                            <div className={css.forumPlantSectionDiv}>  
                                <div className={css.forumPlantSectionTextDiv}>
                                    <p className={css.forumMessageTaskDate}>Alternate Names</p>
                                </div>

                                {
                                    (Array.isArray(message.plant.alternateNames)
                                    ? message.plant.alternateNames
                                    : (message.plant.alternateNames as string).split(',')
                                    )
                                    .map((name: string) => name.trim())
                                    .filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index)
                                    .sort((a: string, b: string) => a.localeCompare(b))
                                    .map((name: string, index: number) => {
                                        const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
                                        return <li className={css.forumMessagePlantListItem} key={`alternateName-${index}`}>{index + 1}. {capitalized}</li>;
                                    })
                                }
                            </div>
                        </div>

                        {message.text && (
                            <p className={css.forumAuthorMediaMsgText}>{message.text}</p>
                        )}

                        <p className={css.forumAuthorTextMsgCreated}>
                            {moment.utc(message.created).local().startOf('seconds').fromNow()}
                        </p>
                    </div>
                )}
            </>
            ))
        )}
        <div ref={chatEndRef}/>
    </div>
  );
};

export default ForumInboxMessages;
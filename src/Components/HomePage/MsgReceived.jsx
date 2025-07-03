import React from 'react'
import {BsTriangleFill} from 'react-icons/bs'
import { useSelector } from 'react-redux'
import { MdCheckCircle } from 'react-icons/md'

const MsgReceived = ({message, timeStamp, selected, onSelect, messageId}) => {
  const Dark = useSelector(state => state.darkMode)
  const newTimeStamp = new Date(timeStamp).getTime()
  const time = new Intl.DateTimeFormat('en-In',{
    timeZone:'Asia/Kolkata',
    timeStyle: "short"
  }).format(newTimeStamp)
  return (
    <div 
      className={`w-full mt-4 flex items-center ${Dark && 'dark'} group relative`}
      onClick={() => onSelect(messageId)}
    >  
      <div className='absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10'>
        {selected ? (
          <MdCheckCircle className="text-theme text-xl" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-theme" />
        )}
      </div>
      <div className='w-fit flex-col relative ml-8'>
        <div className='flex w-fit bg-white transition-colors dark:bg-neutral-900 pl-1 pr-3 py-2 rounded-r-lg rounded-bl-lg cursor-pointer hover:bg-opacity-90 dark:hover:bg-opacity-90 transition-all duration-200'>
          <div className='w-fit max-w-[23rem] px-2 text-black text-[17px] dark:text-neutral-200'>{message}</div>
          <div className='absolute -left-[8px] -top-1 -rotate-[58deg] text-white dark:text-neutral-900 transition-colors'><BsTriangleFill/></div>
          <div className='text-xs mt-auto ml-2 uppercase dark:text-neutral-400'>{time}</div>
        </div>
      </div>
    </div>
  )
}

export default MsgReceived

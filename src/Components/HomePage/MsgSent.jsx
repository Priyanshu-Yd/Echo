import React from 'react'
import {BsTriangleFill} from 'react-icons/bs'
import { MdCheckCircle } from 'react-icons/md'

const MsgSent = ({message, timeStamp, selected, onSelect, messageId}) => {
  const newTimeStamp = new Date(timeStamp).getTime()
  const time = new Intl.DateTimeFormat('en-In',{
    timeZone:'Asia/Kolkata',
    timeStyle: "short"
  }).format(newTimeStamp)

  return (
      <div 
        className='w-full flex justify-end mt-4 items-center group relative'
        onClick={() => onSelect(messageId)}
      >
        <div className='absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10'>
          {selected ? (
            <MdCheckCircle className="text-theme text-xl" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-theme" />
          )}
        </div>
        <div className='relative w-fit flex bg-theme rounded-l-lg rounded-br-lg pl-1 pr-3 py-2 cursor-pointer hover:bg-opacity-90 transition-all duration-200 ml-8'>
            <div className='w-fit max-w-[23rem] pl-2 pr-3 text-[17px] text-white'>{message}</div>
            <div className='absolute -top-1 text-theme -right-[8px] rotate-[59deg]'><BsTriangleFill/></div>
            <div className='text-xs mt-2 uppercase text-white'>{time}</div>
        </div>
    </div>
  )
}

export default MsgSent

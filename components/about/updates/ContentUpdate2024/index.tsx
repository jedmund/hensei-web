import React from 'react'
import { useTranslation } from 'next-i18next'
import ContentUpdate from '~components/about/ContentUpdate'

const ContentUpdate2024 = () => {
  const { t: updates } = useTranslation('updates')

  return (
    <>
      <ContentUpdate
        version="2024-03U"
        dateString="2024/03/10"
        event="events.content"
        transcendedItems={{
          summon: [
            '2040094000',
            '2040100000',
            '2040098000',
            '2040084000',
            '2040090000',
            '2040080000',
          ],
        }}
        uncappedItems={{
          weapon: [
            '1040516200',
            '1040915300',
            '1040116500',
            '1040815800',
            '1040710900',
            '1040024700',
            '1040712600',
            '1040116100',
            '1040712300',
            '1040806000',
            '1040515900',
            '1040616800',
          ],
        }}
        awakenedItems={[
          '1040906400',
          '1040708700',
          '1040212700',
          '1040910000',
          '1040014300',
          '1040207000',
        ]}
      />
      <ContentUpdate
        version="2024-02L"
        dateString="2024/02/29"
        event="events.legfest"
        newItems={{
          character: ['3040515000', '3040513000', '3040514000'],
          weapon: [
            '1040025900',
            '1040618500',
            '1040119100',
            '1040025800',
            '1030010200',
          ],
        }}
      />
      <ContentUpdate
        version="2024-02U"
        dateString="2024/02/20"
        event="events.content"
        newItems={{
          weapon: ['1040618400'],
        }}
        raidItems={['dark-rapture-zero']}
        numNotes={3}
      />
      <ContentUpdate
        version="2024-02F"
        dateString="2024/02/14"
        event="events.flash"
        newItems={{
          character: ['3040512000', '3040511000'],
          weapon: ['1040713200', '1040816400'],
        }}
      />
      <ContentUpdate
        version="2024-01U"
        dateString="2024/02/06"
        event="events.uncap"
        uncappedItems={{
          character: ['3040190000'],
        }}
      />
      <ContentUpdate
        version="2024-01L"
        dateString="2024/01/31"
        event="events.legfest"
        newItems={{
          character: ['3040509000', '3040510000'],
          weapon: ['1040025700', '1040422500', '1040317100', '1030406600'],
        }}
        numNotes={1}
      />
      <ContentUpdate
        version="2024-01U3"
        dateString="2024/01/18"
        event="events.content"
        newItems={{
          character: ['3040506000'],
        }}
        uncappedItems={{
          character: ['3040313000'],
        }}
      />
      <ContentUpdate
        version="2024-01F"
        dateString="2024/01/15"
        event="events.flash"
        newItems={{
          character: ['3040508000', '3040507000'],
          weapon: ['1040422400', '1040219000'],
        }}
        transcendedItems={{
          weapon: [
            '1040212600',
            '1040212500',
            '1040310700',
            '1040310600',
            '1040415100',
            '1040415000',
            '1040809500',
            '1040809400',
            '1040911100',
            '1040911000',
            '1040017100',
            '1040017000',
          ],
        }}
      />
      <ContentUpdate
        version="2024-01U2"
        dateString="2024/01/12"
        event="events.content"
        newItems={{
          character: ['3040504000', '3040505000'],
          weapon: ['1040618300'],
          summon: ['2040426000'],
        }}
      />
      <ContentUpdate
        version="2024-01U"
        dateString="2024/01/05"
        event="events.content"
        newItems={{
          weapon: ['1040025400', '1040816300'],
        }}
        uncappedItems={{
          character: ['3040167000', '3040166000'],
        }}
        numNotes={2}
      />
    </>
  )
}

export default ContentUpdate2024

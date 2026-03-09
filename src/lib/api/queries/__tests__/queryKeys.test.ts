import { describe, it, expect } from 'vitest'

import { partyKeys } from '../party.queries'
import { crewKeys } from '../crew.queries'
import { collectionKeys } from '../collection.queries'
import { userKeys } from '../user.queries'
import { artifactKeys } from '../artifact.queries'
import { entityKeys } from '../entity.queries'
import { jobKeys, jobAccessoryKeys } from '../job.queries'
import { gwKeys } from '../gw.queries'
import { raidKeys } from '../raid.queries'

import { partyQueries } from '../party.queries'
import { crewQueries } from '../crew.queries'
import { collectionQueries } from '../collection.queries'
import { userQueries } from '../user.queries'
import { artifactQueries } from '../artifact.queries'
import { entityQueries } from '../entity.queries'
import { jobQueries } from '../job.queries'
import { gwQueries } from '../gw.queries'
import { raidQueries } from '../raid.queries'
import { searchQueries } from '../search.queries'

// ============================================================================
// partyKeys
// ============================================================================

describe('partyKeys', () => {
	it('produces correct key arrays', () => {
		expect(partyKeys.all).toEqual(['parties'])
		expect(partyKeys.lists()).toEqual(['parties', 'list'])
		expect(partyKeys.list({ element: [1] } as any)).toEqual(['parties', 'list', { element: [1] }])
		expect(partyKeys.userLists()).toEqual(['parties', 'user'])
		expect(partyKeys.userList('alice')).toEqual(['parties', 'user', 'alice', undefined])
		expect(partyKeys.raidLists()).toEqual(['parties', 'raid'])
		expect(partyKeys.raidList('raid-1')).toEqual(['parties', 'raid', 'raid-1', undefined])
		expect(partyKeys.details()).toEqual(['party'])
		expect(partyKeys.detail('abc')).toEqual(['party', 'abc'])
		expect(partyKeys.preview('abc')).toEqual(['party', 'abc', 'preview'])
	})

	it('detail key matches byShortcode queryKey', () => {
		const opts = partyQueries.byShortcode('abc')
		expect(partyKeys.detail('abc')).toEqual(opts.queryKey)
	})

	it('preview key matches previewStatus queryKey', () => {
		const opts = partyQueries.previewStatus('abc')
		expect(partyKeys.preview('abc')).toEqual(opts.queryKey)
	})

	it('list key matches list queryKey', () => {
		const filters = { element: [1] } as any
		const opts = partyQueries.list({ filters })
		expect(partyKeys.list(filters)).toEqual(opts.queryKey)
	})
})

// ============================================================================
// crewKeys
// ============================================================================

describe('crewKeys', () => {
	it('produces correct key arrays', () => {
		expect(crewKeys.all).toEqual(['crew'])
		expect(crewKeys.myCrew()).toEqual(['crew', 'my'])
		expect(crewKeys.membersAll()).toEqual(['crew', 'members'])
		expect(crewKeys.members('active')).toEqual(['crew', 'members', 'active'])
		expect(crewKeys.crewInvitations('crew-1')).toEqual(['crew', 'crew-1', 'invitations'])
		expect(crewKeys.sharedParties()).toEqual(['crew', 'shared_parties'])
		expect(crewKeys.accessibleCollectionMembers()).toEqual([
			'crew',
			'members',
			'accessible-collections'
		])
	})

	it('nested invitations keys', () => {
		expect(crewKeys.invitations.all).toEqual(['invitations'])
		expect(crewKeys.invitations.pending()).toEqual(['invitations', 'pending'])
	})

	it('nested phantomClaims keys', () => {
		expect(crewKeys.phantomClaims.all).toEqual(['phantom_claims'])
		expect(crewKeys.phantomClaims.pending()).toEqual(['phantom_claims', 'pending'])
	})

	it('myCrew key matches query queryKey', () => {
		expect(crewKeys.myCrew()).toEqual(crewQueries.myCrew().queryKey)
	})

	it('members key matches query queryKey', () => {
		expect(crewKeys.members('active')).toEqual(crewQueries.members('active').queryKey)
	})

	it('crewInvitations key matches query queryKey', () => {
		expect(crewKeys.crewInvitations('c-1')).toEqual(crewQueries.crewInvitations('c-1').queryKey)
	})

	it('pendingInvitations key matches query queryKey', () => {
		expect(crewKeys.invitations.pending()).toEqual(crewQueries.pendingInvitations().queryKey)
	})

	it('sharedParties key matches query queryKey', () => {
		expect(crewKeys.sharedParties()).toEqual(crewQueries.sharedParties().queryKey)
	})
})

// ============================================================================
// collectionKeys
// ============================================================================

describe('collectionKeys', () => {
	it('produces correct key arrays', () => {
		expect(collectionKeys.all).toEqual(['collection'])
		expect(collectionKeys.counts('u-1')).toEqual(['collection', 'counts', 'u-1'])
		expect(collectionKeys.character('c-1')).toEqual(['collection', 'character', 'c-1'])
	})

	it('characters branches on userId', () => {
		expect(collectionKeys.characters('u-1')).toEqual(['collection', 'characters', 'u-1'])
		expect(collectionKeys.characters()).toEqual(['collection', 'characters'])
	})

	it('characterIds branches on userId', () => {
		expect(collectionKeys.characterIds('u-1')).toEqual(['collection', 'characters', 'ids', 'u-1'])
		expect(collectionKeys.characterIds()).toEqual(['collection', 'characters', 'ids'])
	})

	it('weapons branches on userId', () => {
		expect(collectionKeys.weapons('u-1')).toEqual(['collection', 'weapons', 'u-1'])
		expect(collectionKeys.weapons()).toEqual(['collection', 'weapons'])
	})

	it('summons branches on userId', () => {
		expect(collectionKeys.summons('u-1')).toEqual(['collection', 'summons', 'u-1'])
		expect(collectionKeys.summons()).toEqual(['collection', 'summons'])
	})

	it('counts key matches query queryKey', () => {
		expect(collectionKeys.counts('u-1')).toEqual(collectionQueries.counts('u-1').queryKey)
	})

	it('character key matches query queryKey', () => {
		expect(collectionKeys.character('c-1')).toEqual(collectionQueries.character('c-1').queryKey)
	})
})

// ============================================================================
// userKeys
// ============================================================================

describe('userKeys', () => {
	it('produces correct key arrays', () => {
		expect(userKeys.all).toEqual(['user'])
		expect(userKeys.me()).toEqual(['user', 'me'])
		expect(userKeys.info('alice')).toEqual(['user', 'alice', 'info'])
		expect(userKeys.profile('alice')).toEqual(['user', 'alice', 'profile'])
		expect(userKeys.parties('alice')).toEqual(['user', 'alice', 'parties'])
		expect(userKeys.favorites()).toEqual(['user', 'favorites'])
		expect(userKeys.checkUsername('bob')).toEqual(['user', 'check', 'username', 'bob'])
		expect(userKeys.checkEmail('a@b.com')).toEqual(['user', 'check', 'email', 'a@b.com'])
	})

	it('me key matches query queryKey', () => {
		expect(userKeys.me()).toEqual(userQueries.me().queryKey)
	})

	it('info key matches query queryKey', () => {
		expect(userKeys.info('alice')).toEqual(userQueries.info('alice').queryKey)
	})

	it('profile key matches query queryKey', () => {
		expect(userKeys.profile('alice')).toEqual(userQueries.profile('alice').queryKey)
	})

	it('checkUsername key matches query queryKey', () => {
		expect(userKeys.checkUsername('bob')).toEqual(userQueries.checkUsername('bob').queryKey)
	})

	it('checkEmail key matches query queryKey', () => {
		expect(userKeys.checkEmail('a@b')).toEqual(userQueries.checkEmail('a@b').queryKey)
	})
})

// ============================================================================
// artifactKeys
// ============================================================================

describe('artifactKeys', () => {
	it('produces correct key arrays', () => {
		expect(artifactKeys.all).toEqual(['artifacts'])
		expect(artifactKeys.reference).toEqual(['artifacts', 'all'])
		expect(artifactKeys.list()).toEqual(['artifacts', 'all', undefined])
		expect(artifactKeys.list({ rarity: 'standard' })).toEqual([
			'artifacts',
			'all',
			{ rarity: 'standard' }
		])
		expect(artifactKeys.detail('a-1')).toEqual(['artifacts', 'detail', 'a-1'])
		expect(artifactKeys.skills).toEqual(['artifacts', 'skills'])
		expect(artifactKeys.skillsForSlot(2)).toEqual(['artifacts', 'skills', 'slot', 2])
		expect(artifactKeys.skillDetail('s-1')).toEqual(['artifacts', 'skills', 'detail', 's-1'])
		expect(artifactKeys.collectionBase).toEqual(['collection', 'artifacts'])
		expect(artifactKeys.collection('u-1')).toEqual(['collection', 'artifacts', 'u-1'])
		expect(artifactKeys.collection()).toEqual(['collection', 'artifacts'])
		expect(artifactKeys.collectionArtifact('ca-1')).toEqual(['collection', 'artifact', 'ca-1'])
	})

	it('detail key matches byId queryKey', () => {
		expect(artifactKeys.detail('a-1')).toEqual(artifactQueries.byId('a-1').queryKey)
	})

	it('skillsForSlot key matches query queryKey', () => {
		expect(artifactKeys.skillsForSlot(3)).toEqual(artifactQueries.skillsForSlot(3).queryKey)
	})

	it('collectionArtifact key matches query queryKey', () => {
		expect(artifactKeys.collectionArtifact('ca-1')).toEqual(
			artifactQueries.collectionArtifact('ca-1').queryKey
		)
	})
})

// ============================================================================
// entityKeys
// ============================================================================

describe('entityKeys', () => {
	it('produces correct key arrays', () => {
		expect(entityKeys.weapons()).toEqual(['weapon'])
		expect(entityKeys.weapon('1040001000')).toEqual(['weapon', '1040001000'])
		expect(entityKeys.characters()).toEqual(['character'])
		expect(entityKeys.character('3040001000')).toEqual(['character', '3040001000'])
		expect(entityKeys.summons()).toEqual(['summon'])
		expect(entityKeys.summon('2040001000')).toEqual(['summon', '2040001000'])
		expect(entityKeys.weaponSeriesList()).toEqual(['weaponSeries', 'list'])
		expect(entityKeys.weaponSeries('dark-opus')).toEqual(['weaponSeries', 'dark-opus'])
		expect(entityKeys.allWeaponSeries()).toEqual(['weaponSeries'])
		expect(entityKeys.characterSeriesList()).toEqual(['characterSeries', 'list'])
		expect(entityKeys.summonSeriesList()).toEqual(['summonSeries', 'list'])
		expect(entityKeys.axSkills()).toEqual(['weaponStatModifiers', 'ax'])
		expect(entityKeys.befoulments()).toEqual(['weaponStatModifiers', 'befoulment'])
		expect(entityKeys.weaponStatModifiers('ax')).toEqual(['weaponStatModifiers', 'ax'])
		expect(entityKeys.weaponStatModifiers()).toEqual(['weaponStatModifiers', 'all'])
	})

	it('weapon key matches query queryKey', () => {
		expect(entityKeys.weapon('1040001000')).toEqual(
			entityQueries.weapon('1040001000').queryKey
		)
	})

	it('character key matches query queryKey', () => {
		expect(entityKeys.character('3040001000')).toEqual(
			entityQueries.character('3040001000').queryKey
		)
	})

	it('summon key matches query queryKey', () => {
		expect(entityKeys.summon('2040001000')).toEqual(
			entityQueries.summon('2040001000').queryKey
		)
	})

	it('weaponKeys matches query queryKey', () => {
		const params = { seriesSlug: 'dark-opus', slot: 1, group: 'a' }
		expect(entityKeys.weaponKeys(params)).toEqual(entityQueries.weaponKeys(params).queryKey)
	})

	it('series keys match query queryKeys', () => {
		expect(entityKeys.weaponSeriesList()).toEqual(entityQueries.weaponSeriesList().queryKey)
		expect(entityKeys.weaponSeries('dark-opus')).toEqual(
			entityQueries.weaponSeries('dark-opus').queryKey
		)
		expect(entityKeys.characterSeriesList()).toEqual(
			entityQueries.characterSeriesList().queryKey
		)
		expect(entityKeys.summonSeriesList()).toEqual(entityQueries.summonSeriesList().queryKey)
	})

	it('stat modifier keys match query queryKeys', () => {
		expect(entityKeys.weaponStatModifiers('ax')).toEqual(
			entityQueries.weaponStatModifiers('ax').queryKey
		)
		expect(entityKeys.axSkills()).toEqual(entityQueries.axSkills().queryKey)
		expect(entityKeys.befoulments()).toEqual(entityQueries.befoulments().queryKey)
	})
})

// ============================================================================
// jobKeys + jobAccessoryKeys
// ============================================================================

describe('jobKeys', () => {
	it('produces correct key arrays', () => {
		expect(jobKeys.all).toEqual(['jobs'])
		expect(jobKeys.lists()).toEqual(['jobs'])
		expect(jobKeys.detail('j-1')).toEqual(['jobs', 'j-1'])
		expect(jobKeys.skills('j-1')).toEqual(['jobs', 'j-1', 'skills'])
		expect(jobKeys.empSkills('j-1')).toEqual(['jobs', 'j-1', 'emp_skills'])
		expect(jobKeys.skillsSearch('j-1')).toEqual([
			'jobs',
			'j-1',
			'skills',
			'search',
			undefined
		])
		expect(jobKeys.accessoriesForJob('j-1')).toEqual(['jobs', 'j-1', 'accessories'])
		expect(jobKeys.allSkills()).toEqual(['jobs', 'skills', 'all'])
	})

	it('detail key matches byId queryKey', () => {
		expect(jobKeys.detail('j-1')).toEqual(jobQueries.byId('j-1').queryKey)
	})

	it('skills key matches skillsByJob queryKey', () => {
		expect(jobKeys.skills('j-1')).toEqual(jobQueries.skillsByJob('j-1').queryKey)
	})

	it('empSkills key matches query queryKey', () => {
		expect(jobKeys.empSkills('j-1')).toEqual(jobQueries.empSkills('j-1').queryKey)
	})

	it('accessoriesForJob key matches query queryKey', () => {
		expect(jobKeys.accessoriesForJob('j-1')).toEqual(
			jobQueries.accessoriesForJob('j-1').queryKey
		)
	})

	it('allSkills key matches query queryKey', () => {
		expect(jobKeys.allSkills()).toEqual(jobQueries.allSkills().queryKey)
	})
})

describe('jobAccessoryKeys', () => {
	it('produces correct key arrays', () => {
		expect(jobAccessoryKeys.all).toEqual(['jobAccessories'])
		expect(jobAccessoryKeys.lists(1)).toEqual(['jobAccessories', { accessoryType: 1 }])
		expect(jobAccessoryKeys.detail('a-1')).toEqual(['jobAccessories', 'a-1'])
	})

	it('lists key matches accessoriesList queryKey', () => {
		expect(jobAccessoryKeys.lists(2)).toEqual(jobQueries.accessoriesList(2).queryKey)
	})

	it('detail key matches accessoryById queryKey', () => {
		expect(jobAccessoryKeys.detail('a-1')).toEqual(jobQueries.accessoryById('a-1').queryKey)
	})
})

// ============================================================================
// gwKeys
// ============================================================================

describe('gwKeys', () => {
	it('produces correct key arrays', () => {
		expect(gwKeys.all).toEqual(['gw'])
		expect(gwKeys.events()).toEqual(['gw', 'events'])
		expect(gwKeys.event('e-1')).toEqual(['gw', 'events', 'e-1'])
		expect(gwKeys.participationsAll()).toEqual(['gw', 'participations'])
		expect(gwKeys.participation('p-1')).toEqual(['gw', 'participations', 'p-1'])
		expect(gwKeys.memberGwScores('m-1')).toEqual(['crew', 'member', 'm-1', 'gw_scores'])
		expect(gwKeys.memberGwScoresByUsername('alice')).toEqual([
			'crew',
			'member',
			'username',
			'alice',
			'gw_scores'
		])
		expect(gwKeys.phantomGwScores('ph-1')).toEqual(['crew', 'phantom', 'ph-1', 'gw_scores'])
	})

	it('events key matches query queryKey', () => {
		expect(gwKeys.events()).toEqual(gwQueries.events().queryKey)
	})

	it('event key matches query queryKey', () => {
		expect(gwKeys.event('e-1')).toEqual(gwQueries.event('e-1').queryKey)
	})

	it('participation key matches query queryKey', () => {
		expect(gwKeys.participation('p-1')).toEqual(gwQueries.participation('p-1').queryKey)
	})

	it('memberGwScores key matches query queryKey', () => {
		expect(gwKeys.memberGwScores('m-1')).toEqual(gwQueries.memberGwScores('m-1').queryKey)
	})

	it('phantomGwScores key matches query queryKey', () => {
		expect(gwKeys.phantomGwScores('ph-1')).toEqual(gwQueries.phantomGwScores('ph-1').queryKey)
	})
})

// ============================================================================
// raidKeys
// ============================================================================

describe('raidKeys', () => {
	it('produces correct key arrays', () => {
		expect(raidKeys.all).toEqual(['raids'])
		expect(raidKeys.groups()).toEqual(['raids', 'groups'])
		expect(raidKeys.detail('proto-bahamut')).toEqual(['raids', 'proto-bahamut'])
	})

	it('groups key matches query queryKey', () => {
		expect(raidKeys.groups()).toEqual(raidQueries.groups().queryKey)
	})

	it('detail key matches bySlug queryKey', () => {
		expect(raidKeys.detail('proto-bahamut')).toEqual(
			raidQueries.bySlug('proto-bahamut').queryKey
		)
	})
})

// ============================================================================
// searchQueries (no separate keys export — test queryKey from factories)
// ============================================================================

describe('searchQueries queryKeys', () => {
	it('weapons queryKey includes search type', () => {
		const opts = searchQueries.weapons('sword', { element: [1] }, 'ja')
		expect(opts.queryKey).toEqual(['search', 'weapons', 'sword', { element: [1] }, 'ja'])
	})

	it('characters queryKey includes exclude', () => {
		const opts = searchQueries.characters('hero', undefined, 'en', ['exc-1'])
		expect(opts.queryKey).toEqual(['search', 'characters', 'hero', undefined, 'en', ['exc-1']])
	})

	it('summons queryKey includes search type', () => {
		const opts = searchQueries.summons('', { rarity: [3] })
		expect(opts.queryKey).toEqual(['search', 'summons', '', { rarity: [3] }, 'en'])
	})
})

import { FirebaseApp as FirebaseAppType, initializeApp } from 'firebase/app'
import {
	GoogleAuthProvider,
	browserLocalPersistence,
	getAuth,
	setPersistence,
	signInWithPopup,
	signOut,
} from 'firebase/auth'
import {
	equalTo,
	get,
	getDatabase,
	onValue,
	orderByChild,
	push,
	query,
	ref,
	remove,
	update,
} from 'firebase/database'

import { getAnalytics } from 'firebase/analytics'

interface User {
	uid: string
}

interface UserData extends User {
	id: string
}

class FirebaseApp {
	analytics: ReturnType<typeof getAnalytics>
	database: ReturnType<typeof getDatabase>
	auth: ReturnType<typeof getAuth>
	provider: GoogleAuthProvider
	currentUser: UserData | null
	initialize: FirebaseAppType

	constructor() {
		this.initialize = this.initializeFirebase()
		this.analytics = getAnalytics()
		this.database = getDatabase()
		this.auth = getAuth()
		this.provider = new GoogleAuthProvider()
		this.currentUser = null
		this.init()
	}

	initializeFirebase() {
		return initializeApp({
			apiKey: 'AIzaSyChz-Np_Y9COGPRgjekxqxSb_ciaF80k8U',
			authDomain: 'blog-app-85585.firebaseapp.com',
			projectId: 'blog-app-85585',
			storageBucket: 'blog-app-85585.appspot.com',
			messagingSenderId: '108552257802',
			appId: '1:108552257802:web:1db3028248f92a04d0faf3',
			measurementId: 'G-CGKHGLD9Z4',
		})
	}

	async signInWithGoogle() {
		try {
			await setPersistence(this.auth, browserLocalPersistence)
			const result = await signInWithPopup(this.auth, this.provider)
			return result.user
		} catch (error) {
			throw new Error(error)
		}
	}

	async signOut() {
		try {
			await signOut(this.auth)
			return []
		} catch (error) {
			throw new Error(error)
		}
	}

	init() {
		return new Promise<void>(resolve => {
			const unsubscribe = this.auth.onAuthStateChanged(user => {
				this.currentUser = user ? ({ ...user, id: user.uid } as UserData) : null
				resolve()
			})

			return unsubscribe
		})
	}

	async add(value: UserData, reference: string) {
		const dbRef = ref(
			this.database,
			`${reference}/${this.auth.currentUser!.uid}`
		)

		try {
			value.uid = this.auth.currentUser!.uid

			const nodeQuery = query(dbRef, orderByChild('id'))
			const snapshot = await get(nodeQuery)

			const data = snapshot.val() || {}
			const idExists = Object.values(data as Record<string, UserData>).some(
				(item: UserData) => item.id === value.id
			)

			if (!idExists) {
				push(dbRef, value)
			} else {
				console.log('ID already exists')
				return
			}
		} catch (error) {
			console.error('Error adding data:', error)
		}
	}

	async fetchAndSet(setData: (data: UserData[]) => void, reference: string) {
		await this.init()

		return new Promise((resolve, reject) => {
			if (this.currentUser) {
				const dbRef = ref(this.database, `${reference}/${this.currentUser.uid}`)
				const userRef = query(
					dbRef,
					orderByChild('uid'),
					equalTo(this.currentUser.uid)
				)

				onValue(
					userRef,
					snapshot => {
						const data = snapshot.val()

						if (data) {
							const result = Object.entries(data).map(([key, value]) => ({
								key,
								...(value as UserData),
							}))

							setData(result)
							resolve(result)
						} else {
							setData([])
							resolve([])
						}
					},
					error => {
						console.error('Error in onValue:', error)
						reject(error)
					}
				)
			} else {
				setData([])
				console.error('No user authenticated')
				reject()
			}
		})
	}

	fetchToUpdate(reference: string, key: string) {
		return new Promise<number | null>((resolve, reject) => {
			const dbRef = ref(
				this.database,
				`${reference}/${this.currentUser!.uid}/${key}`
			)

			if (this.currentUser) {
				onValue(
					dbRef,
					snapshot => {
						const data = snapshot.val()
						const count = data?.count

						if (!isNaN(count)) {
							resolve(count)
						} else {
							console.error('Invalid count in fetchToUpdate:', count)
							resolve(null)
						}
					},
					error => {
						reject(error)
					}
				)
			} else {
				console.error('No user authenticated')
				resolve(null)
			}
		})
	}

	async delete(key: string, reference: string) {
		try {
			const itemRef = ref(
				this.database,
				`${reference}/${this.currentUser!.uid}/${key}`
			)
			await remove(itemRef)
		} catch (error) {
			console.error('Error deleting data:', error)
		}
	}

	async update(reference: string, key: string, updatedData: Partial<UserData>) {
		try {
			const itemRef = ref(
				this.database,
				`${reference}/${this.currentUser!.uid}/${key}`
			)
			await update(itemRef, updatedData)
		} catch (error) {
			console.error('Error updating data:', error)
		}
	}
}

export default FirebaseApp

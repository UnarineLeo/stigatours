import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification,
  applyActionCode, sendPasswordResetEmail, setPersistence, browserLocalPersistence}
  from "firebase/auth";
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { LoadingController } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { setDoc, getDoc, doc, getFirestore, serverTimestamp } from "firebase/firestore";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(public auth: AngularFireAuth, private router: Router,
    private toastController: ToastController, private firestore: AngularFirestore,
    public loader: LoadingController,
    private modalController: ModalController) 
  {
    this.initializeAuth()
  }

  isLoggedIn = false;
  userName = `Guest`;
  isVerified = false;
  userEmail : string = ''
  regVerification = false;
  userId: string = ''
  userRole: string = 'user';

  db = getFirestore(firebase.initializeApp(environment.firebaseConfig))

  private async initializeAuth() {
    const authInstance = getAuth(firebase.initializeApp(environment.firebaseConfig));
    await setPersistence(authInstance, browserLocalPersistence);

    authInstance.onAuthStateChanged(async (user) => {
      const isLoggedIn = !!user;
      this.authState.next(isLoggedIn);
    });
  }

  async isAuthenticated(): Promise<boolean> 
  {
    const authInstance = getAuth(firebase.initializeApp(environment.firebaseConfig));
    await setPersistence(authInstance, browserLocalPersistence);
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = authInstance.currentUser;
    if(!user) 
    {
      await new Promise(resolve => setTimeout(resolve, 500));
      return !!authInstance.currentUser;
    }
    this.updateUserState(user);
    return true;
  }

  private authState = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.authState.asObservable(); ///I don't think theres a need for this

  private updateUserState(user: any) 
  {
    this.isLoggedIn = true;
    this.authState.next(true);
    this.userName = user.displayName || 'Guest';
    this.userEmail = user.email || 'not signed in';
    this.isVerified = user.emailVerified ?? false;
    this.userId = user.uid || '';
    this.userRole = user.role || 'user';
  }

  // GoogleSign

  async googleSignIn()
  {
    const authInstance = getAuth(firebase.initializeApp(environment.firebaseConfig));
    await setPersistence(authInstance, browserLocalPersistence);

    try {
      const res: any = await signInWithPopup(authInstance, new GoogleAuthProvider);

      this.updateUserState(res.user)

      await this.router.navigate(['/tabs/profile'])
      await this.presentToast('Successfully logged in')

      await this.addUser(res.user)
      // this.userId = res.user?.uid
      return res;
    } catch (err: any) {
      if(err.code === 'auth/internal-error')
      {
        await this.presentToast('Problem from our end, please try again later')
      }
      else
      {
        await this.presentToast('Error signing in with Google, please try again or contact support')
      }

      throw err;
    }
  }

  // LogIn with email/password

  async loginFireAuth(value: any)
  {
    // const loading = await this.loader.create({
    //   cssClass: 'transparent-loader'
    // });
    // await loading.present();
    console.log('Attempting login with email:', value.email);

    const authInstance = getAuth(firebase.initializeApp(environment.firebaseConfig));
    await setPersistence(authInstance, browserLocalPersistence);

    console.log("Firebase app initialized, starting login process...");

    try {
      const res: any = await signInWithEmailAndPassword(authInstance, value.email, value.password);

      console.log('Login successful, user email verified:', res.user?.emailVerified);
      this.updateUserState(res.user);
      this.regVerification = !res.user?.emailVerified;

      await this.dismissTopModal();

      // await loading.dismiss();
      await this.router.navigate(['/tabs/profile'])

      if (res.user?.emailVerified) {
        await this.presentToast('Successfully logged in')
      } else {
        await this.presentToast('Successfully logged in. Please verify your email from your profile page.')
      }

      await this.getUser(res.user.uid)

      return res;
    } catch (error: any) {
      // await loading.dismiss();

      if(error.code === 'auth/user-not-found')
      {
        await this.presentToast('Email doesn\'t exist, please register first')
      }
      else if(error.code === 'auth/wrong-password')
      {
        await this.presentToast('Incorrect password, please try again')
      }
      else if(error.code === 'auth/internal-error')
      {
        await this.presentToast('Problem from our end, please try again later')
      }
      else if(error.code === 'auth/invalid-credential')
      {
        await this.presentToast('Invalid credentials, please try again')
      }
      else
      {
        await this.presentToast(error.code)
      }

      throw error;
    }
  }

  // Register with email/password

  async userRegistration(value: any)
  {
    console.log('Received registration data:', value);
    // const loading = await this.loader.create({
    //   cssClass: 'transparent-loader'
    // });
    // loading.present();
    

    console.log("Now checking Firebase app initialization...");

    const authInstance = getAuth(firebase.initializeApp(environment.firebaseConfig));
    await setPersistence(authInstance, browserLocalPersistence);

    console.log('Starting registration process for email:', value.email);

    try {
      const res: any = await createUserWithEmailAndPassword(authInstance, value.email, value.password);

      await updateProfile(res.user, {
        displayName: value.displayName,
      });

      if (!res.user?.emailVerified) {
        await sendEmailVerification(res.user);
      }

      this.isLoggedIn = true;
      this.authState.next(true);
      this.userName = value.displayName;
      this.isVerified = res.user.emailVerified;
      this.userEmail = res.user.email;
      this.regVerification = true;
      this.userId = res.user?.uid;

      await this.dismissTopModal();

      await this.router.navigate(['/tabs/profile']);
      await this.presentToast('Successfully registered, please check your email to verify your account');
      await this.addUser(res.user);

      return res;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use' || error.code === 'auth/email-already-exists') {
        await this.presentToast('Email already in use');
      } else if (error.code === 'auth/internal-error') {
        await this.presentToast('Problem from our end, please try again later');
      } else {
        await this.presentToast('Error signing up, please try again or contact support');
      }

      throw error;
    } finally {
      // loading.dismiss();
    }
  }

  // forgot password
  async forgotPassword(email: any)
  {
    try {
      await sendPasswordResetEmail(getAuth(firebase.initializeApp(environment.firebaseConfig)), email)
      await this.presentToast('Password reset email sent, check your inbox')
    }
    catch (error: any) {
      if(error.code === 'auth/user-not-found')
      {
        await this.presentToast('Email doesn\'t exist, please register first')
      }
      else if(error.code === 'auth/wrong-password')
      {
        await this.presentToast('Incorrect password, please try again')
      }
      else if(error.code === 'auth/internal-error')
      {
        await this.presentToast('Problem from our end, please try again later')
      }
      else
      {
        await this.presentToast(error.code)
      }
    }
  }

  //  Logout

  async logOut(options?: { toastMessage?: string; redirectTo?: string; forceReload?: boolean }) {
    try {
      await signOut(getAuth(firebase.initializeApp(environment.firebaseConfig)))

      sessionStorage.clear()
      this.isLoggedIn = false
      this.authState.next(false)
      this.userName = 'Guest'

      if (options?.toastMessage) {
        await this.presentToast(options.toastMessage)
      }

      if (options?.forceReload) {
        window.location.reload()
        return
      }

      await this.router.navigate([options?.redirectTo ?? '/tabs/home'])
    } catch (error: any) {
      if(error.code === 'auth/internal-error')
      {
        await this.presentToast('Problem from our end, please try again later')
      }
      else
      {
        await this.presentToast(error.code)
      }
    }
  }

  async presentToast(msg: any) {
    const toast = await this.toastController.create({
      cssClass: 'app-toast',
      message: msg,
      duration: 1300,
      position: 'bottom',
    });

    await toast.present();
  }

  // Add user to firestore

  async addUser(user: any): Promise<void> {
    const userRef = doc(this.db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) 
    {
      const mergePayload: Record<string, unknown> = {
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        lastSignIn: serverTimestamp(),
      };

      await setDoc(userRef, mergePayload, { merge: true });
    } 
    else 
    {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        lastSignIn: serverTimestamp(),
        role: 'user',
      });
    }
  }

  // Get user from firestore
  async getUser(uid: string) : Promise<JSON>
  {
    const userRef = doc(this.db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      this.userRole = 'user';
      return JSON.parse('{}');
    }

    const userData = userDoc.data() as Record<string, unknown>;
    this.userRole = (userData['role'] as string | undefined) || 'user';

    if (typeof userData['displayName'] === 'string' && userData['displayName']) {
      this.userName = userData['displayName'];
    }

    return userData as unknown as JSON;
  }

  async getCurrentUserRole(): Promise<string | null> {
    const authInstance = getAuth(firebase.initializeApp(environment.firebaseConfig));
    const user = authInstance.currentUser;

    if (!user) {
      this.userRole = 'user';
      return null;
    }

    const userRef = doc(this.db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      this.userRole = 'user';
      return 'user';
    }

    const role = (userDoc.data()?.['role'] as string | undefined) ?? 'user';
    this.userRole = role;
    this.userId = user.uid;
    this.userEmail = user.email || 'not signed in';
    return role;
  }

  async isCurrentUserAdmin(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'admin';
  }

  private async dismissTopModal(): Promise<void> {
    const topModal = await this.modalController.getTop();
    if (!topModal) {
      return;
    }

    await this.modalController.dismiss();
  }

}
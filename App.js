import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, View, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';

export default function App() {
  const [deviceToken, setDeviceToken] = useState('');
  console.log('deviceToken: ', deviceToken);

  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission({
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      provisional: false,
      sound: true,
    });

    console.log('Authorization status:', authStatus);
    getFCMToken();
  };

  const registerAppWithFCM = async () => {
    await messaging().registerDeviceForRemoteMessages();
  };

  const getFCMToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      console.log('fcmToken: ', fcmToken);
      if (fcmToken) {
        setDeviceToken(fcmToken);
      }
    } catch (error) {
      console.log('🚀 ~ getFCMToken ~ error', error);
    }
  };

  useEffect(() => {
    registerAppWithFCM();
    requestUserPermission();

    messaging().onNotificationOpenedApp(async (remoteMessage) => {
      console.log('🚀background state  remoteMessage', remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (remoteMessage) {
          console.log(
            '🚀 Notification caused app to open quit state',
            remoteMessage
          );
        }
      });

    messaging().onMessage(async (remoteMessage) => {
      console.log('foreground state  remoteMessage', remoteMessage);
    });
  }, []);

  useEffect(() => {
    PushNotification.createChannel(
      {
        channelId: 'channel-id', // (required)
        channelName: 'My channel', // (required)
        channelDescription: 'A channel to categorise your notifications', // (optional) default: undefined.
        playSound: false, // (optional) default: true
        soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
        importance: 4, // (optional) default: 4. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
      },
      (created) => console.log(`createChannel returned '${created}'`) // (optional) callback returns whether the channel was created, false means it already existed.
    );

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      if (Platform.OS === 'android') {
        PushNotification.localNotification({
          channelId: 'fcm_fallback_notification_channel',
          message: remoteMessage.notification.body,
          title: remoteMessage.notification.title,
          bigPictureUrl: remoteMessage.notification.android.imageUrl,
          smallIcon: remoteMessage.notification.android.imageUrl,
        });
      } else {
        console.log('foreground state  remoteMessage', remoteMessage);
      }
    });
    return unsubscribe;
  }, []);

  const localNotification = () => {
    PushNotification.localNotification({
      channelId: 'channel-id',
      title: 'Local Notification',
      message: 'This is a Local Notification!',
      date: new Date(Date.now() + 5000), // 5 seconds from now
    });
  };

  const scheduleNotification = () => {
    console.log('scheduleNotification');
    PushNotification.localNotificationSchedule({
      channelId: 'channel-id',
      title: 'Scheduled Notification',
      message: 'This is a scheduled notification!',
      date: new Date(Date.now() + 1000),
      allowWhileIdle: true, // (optional) set notification to work while on doze, default: false
      /* Android Only Properties */
      repeatTime: 1,
    });
  };

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
      <Button title="Local Notification" onPress={localNotification} />

      <Button title="Schedule Notification" onPress={scheduleNotification} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

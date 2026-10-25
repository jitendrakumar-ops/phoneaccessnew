import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  PermissionsAndroid, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

export default function GalleryScreen() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const requestGalleryPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const permission = Platform.Version >= 33 
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES 
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission, {
          title: 'Gallery Permission',
          message: 'App needs access to your gallery to show photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        });

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
          return true;
        } else {
          Alert.alert('Permission Denied', 'Cannot access gallery without permission.');
          setHasPermission(false);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const loadPhotos = async () => {
    const isGranted = await requestGalleryPermission();
    if (!isGranted) return;

    setLoading(true);
    try {
      const result = await CameraRoll.getPhotos({
        first: 50,
        assetType: 'Photos',
      });
      setPhotos(result.edges.map(edge => edge.node.image));
    } catch (error) {
      console.error('Failed to load photos:', error);
      Alert.alert('Error', 'Failed to load photos from gallery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  
    loadPhotos();
  }, []);

  const renderItem = ({ item }) => (
    <View 
      className="flex-1 m-1 rounded-lg overflow-hidden bg-slate-800" 
      style={{ aspectRatio: 1 }}
    >
      <Image 
        source={{ uri: item.uri }} 
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <View className="flex-1 bg-slate-950 px-2 py-4">
      <Text className="text-3xl font-bold text-white mb-4 px-4">Gallery</Text>
      
      {!hasPermission && !loading && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-400 mb-4">Gallery permission is required</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#10b981" />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item, index) => item.uri + index}
          numColumns={3}
          renderItem={renderItem}
          ListEmptyComponent={
            hasPermission ? <Text className="text-slate-400 text-center mt-10">No photos found in gallery.</Text> : null
          }
        />
      )}
    </View>
  );
}

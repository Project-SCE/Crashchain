const { pinata } = require('../config/pinata');
const { getCrashContract, isBlockchainInitialized } = require('../config/blockchain');
const { debug, error } = require('../utils/logger');

async function fetchAllGroupsAndFiles() {
  try {
    debug('Fetching all groups from IPFS');
    const groups = await pinata.groups.list();

    if (!Array.isArray(groups)) {
      error('Invalid groups structure received:', groups);
      return [];
    }

    // Check if blockchain is initialized
    if (!isBlockchainInitialized()) {
      error('Blockchain not initialized');
      return groups.map(group => ({ 
        groupId: group.id, 
        groupName: group.name, 
        files: [], 
        blockchainData: [] 
      }));
    }

    const crashContract = getCrashContract();
    
    // Get total metadata count
    const totalMetadata = await crashContract.methods.getTotalMetadataCount().call();
    debug(`Total metadata count from blockchain: ${totalMetadata}`);

    // Fetch all metadata from blockchain
    const blockchainMetadata = [];
    for (let i = 0; i < totalMetadata; i++) {
      try {
        const metadata = await crashContract.methods.getMetadata(i).call();
        if (metadata) {
          blockchainMetadata.push({
            index: i,
            dataId: metadata[0],
            vin: metadata[1],
            timestamp: metadata[2],
            location: metadata[3],
            cids: metadata[4]
          });
        }
      } catch (err) {
        error(`Error fetching metadata at index ${i}:`, err);
      }
    }

    // Process groups
    const groupData = await Promise.all(
      groups.map(async (group) => {
        try {
          debug(`Fetching files for group ID: ${group.id}`);
          const filesResponse = await pinata.listFiles().group(group.id);

          if (!filesResponse || !Array.isArray(filesResponse)) {
            return { 
              groupId: group.id, 
              groupName: group.name, 
              files: [], 
              blockchainData: [] 
            };
          }
          
          const files = filesResponse.map((file) => ({
            cid: file.ipfs_pin_hash,
            name: file.metadata?.name || 'Unknown',
            mimeType: file.mime_type,
            size: file.size,
          }));

          const matchingMetadata = blockchainMetadata.filter(metadata => 
            metadata.cids && Array.isArray(metadata.cids) && 
            metadata.cids.some(cid => files.some(file => file.cid === cid))
          );
          
          return { 
            groupId: group.id, 
            groupName: group.name, 
            files,
            blockchainData: matchingMetadata
          };
        } catch (err) {
          error(`Error processing group ${group.id}:`, err);
          return { 
            groupId: group.id, 
            groupName: group.name, 
            files: [], 
            blockchainData: [] 
          };
        }
      })
    );

    debug('Group data cache populated successfully');
    return groupData;
  } catch (err) {
    error('Error fetching groups or files:', err.message);
    return [];
  }
}

module.exports = { fetchAllGroupsAndFiles };
# Securing Smart Home IoT devices using Hyperledger Fabric

The project aims to implement a Hyperledger fabric blockchain network using the Fablo toolkit for securing smart home IoT devices.
This network is simulated using Docker Containers. Hyperledger Explorer and Hyperledger Caliper are also integrated with the project.

## Abstract
The project explores the application of Hyperledger Fabric, a private permissioned
blockchain framework, with the Fablo toolkit as a robust solution to enhance the security of Smart Home IoT devices. Hyperledger Fabric’s
decentralized and tamper-resistant nature provides a foundation for
establishing a secure and transparent environment for IoT devices.
By leveraging the inherent features of Hyperledger Fabric, such as
it’s consensus mechanism, smart contracts, and permissioned network
structure, this research aims to mitigate common security concerns
associated with Smart Home IoT devices, including unauthorized access, data tampering, and device compromise


## Methodology


## Installation & Deployment

**Requirements:**

- `docker-compose` 
- ``nodejs`` *(Recommended Version : 12 or Higher)*

**Steps:**
```bash
  git clone https://github.com/PraneshCBE/Hyperledger-for-IoT.git
  cd Hyperledger-for-IoT
  chmod +x fablo
  ./fablo up fablo-config.json
```

## REST APIs Using Fablo Rest
Use the below Endpoints with :
**http://localhost:{org-port}**

**Organisations & Ports**
```
Orderers : 8800
HomeApplicance : 8801
Survillence : 8802
Intelli : 8803
```


### /user/enroll

**Description**: Enrolls the existing user for Session Token

**Method**: POST

**Body**
```http
{
    "id":"admin",
    "secret":"adminpw"
}
```

**Sample Successful Response**:
```http
{
    "token": "32c4c690-fc1a-11ee-a359-e30085dbc7ec-admin"
}
```

***Note***: 
From now on for every endpoints this Token (will expire in 15 mins) is required in the following format
| Header | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `Auth` | `Bearer Token` | **Required** Admin token received on Enroll |

### /user/register

**Description**: Register new user (Only Admin can do this)

**Method**: POST

**Body**
```http
{
    "id":"lalith",
    "secret":"lalith123"
}
```

**Sample Successful Response**:
```http
{
    "message": "ok"
}
```

### /user/identities

**Description**: List of all Users in the respective Organisation's channel (Only Admin can do this)

**Method**: GET

### Invoke Endpoints
/invoke/:channel-name/:chaincode-name

**Method**: POST

**Add device** 

*Sample Body*
```http
{
    "method":"KVContract:addDevice",
    "args":[
        "192.168.0.4","Cam 2","toggle"
    ]
}
```

**Perofrm Action By Device ID** 

*Description* : Perform Action on a certain device by providing their IP as argumrnts

*Sample Body*
```http
{
    "method":"KVContract:performAction",
    "args":[
        "192.168.0.1","ON","","admin"
    ]
}
```


**Perofrm Action Function only for Admin** 

*Description* : Doesn't consider the Set Transaction Limit (only by admin) 

*Sample Body*
```http
{
    "method":"KVContract:performAction",
    "args":[
        "192.168.0.1","ON","","admin"
    ]
}
```

**Change Transaction Limits Per Day** 

*Description* : Change the Transaction Limit per day (only by admin).

*Sample Body*
```http
{
    "method":"KVContract:changeLimitsPerDay",
    "args":[
        "10"
    ]
}
```

**Delete a Device** 

*Description* : Delete an existing Device (only by admin).

*Sample Body*
```http
{
    "method":"KVContract:deleteDevice",
    "args":[
        "192.168.0.1"
    ]
}
```

### Query Endpoints
/query/:channel-name/:chaincode-name

**Method**: POST

**Get All devices** 

*Description* :Returns all Devices available in the respective channel

*Sample Body*
```http
{
    "method":"KVContract:getAllDevices",
    "args":[]
}
```

**Get a Device's History** 

*Description* :Returns a devices transaction History with given IP of that Device as argument.

*Sample Body*
```http
{
    "method":"KVContract:getDeviceHistoryByIp",
    "args":[
        "192.168.0.2"
    ]
}
```

**Get Status of a Device** 

*Description* :Returns the status of a device with the given IP as Argument.

*Sample Body*
```http
{
    "method":"KVContract:getDeviceStatus",
    "args":[
        "192.168.0.1"
    ]
}
```

**Get List of Devices based on Status** 

*Description* :Returns list of devices on respectuve channel based on the Status given as Argument.

*Sample Body*
```http
{
    "method":"KVContract:getDevicesByStatus",
    "args":[
        "ON"
    ]
}
```


## Network 

![App Screenshot](https://i.ibb.co/5GL9WNv/Network-topology-enlarged.png)
## Contributing

The future scope of this project is to deploy the fabric network in Raspberry Pi modules (peers) once the ARM images of the fabric are available. Integrating other features like Hyperledger Firefly, etc is also planned.
## Support

Pranesh R - pranesh.r702@gmail.com

Lalith Guptha B - lalithg95@gmail.com

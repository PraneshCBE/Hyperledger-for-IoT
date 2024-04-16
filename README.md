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

**Organisations & Ports**
```
Orderers : 8800
HomeApplicance : 8801
Survillence : 8802
Intelli : 8803
```
### http://localhost:{org-port}/user/enroll

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

### http://localhost:{org-port}/user/register

**Description**: Register new user (Only Admin can do this)

**Method**: POST


| Header | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `Auth` | `Bearer Token` | **Required** Admin token received on Enroll |


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

## Contact
Pranesh R - pranesh.r702@gmail.com

Lalith Guptha B - lalithg95@gmail.com
## Contributing

The future scope of this project is to deploy the fabric network in Raspberry Pi modules (peers) once the ARM images of the fabric are available. Integrating other features like Hyperledger Firefly, etc is also planned.

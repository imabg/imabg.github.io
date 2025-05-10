---
title: "Notes - Amazon DynamoDB - Distributed NoSQL database"
draft: false
tags:
  - whitepapers
  - database
  - 2025
---

**Paper <a href="https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf" target="_blank">Link</a>**

## Problem statement:

To solve reliability issue at a massive scale, Amazon introduced DynamoDB which achieve 100% reliability by scarifies consistency under certain failure scenarios 

## Solution proposed: 

- Dynamo is designed to be an eventually consistent data store; that is all updates reach all replicas eventually
- Dynamo targets the design space of an “always writeable” data store (i.e., a data store that is highly available for writes)
	- complexity of conflict resolution to the reads in order to ensure that writes are never rejected
- The next design choice is who performs the process of conflict resolution. This can be done by the data store or the application. If conflict resolution is done by the data store, its choices are rather limited. In such cases, the data store can only use simple policies, such as “last write wins”, to resolve conflicting updates. On the other hand, since the application is aware of the data schema it can decide on the conflict resolution method that is best suited for its client’s experience.
- Incremental scalability: Dynamo should be able to scale out one storage host (henceforth, referred to as “node”) at a time, with minimal impact on both operators of the system and the system itself
- Symmetry: Every node in Dynamo should have the same set of responsibilities as its peers; there should be no distinguished node or nodes that take special roles or extra set of responsibilities. In our experience, symmetry simplifies the process of system provisioning and maintenance
- Decentralization: An extension of symmetry, the design should favor decentralized peer-to-peer techniques over centralized control. In the past, centralized control has resulted in outages and the goal is to avoid it as much as possible. This leads to a simpler, more scalable, and more available system
- Heterogeneity: The system needs to be able to exploit heterogeneity in the infrastructure it runs on. e.g. the work distribution must be proportional to the capabilities of the individual servers. This is essential in adding new nodes with higher capacity without having to upgrade all hosts at once.
- Dynamo is targeted mainly at applications that need an “always writeable” data store where no updates are rejected due to failures or concurrent writes
- Dynamo is built for an infrastructure within a single administrative domain where all nodes are assumed to be trusted
- applications that use Dynamo do not require support for hierarchical namespaces (a norm in many file systems) or complex relational schema (supported by traditional databases)
- Dynamo is built for latency sensitive applications that require at least 99.9% of read and write operations to be performed within a few hundred milliseconds
![[dynamo-technique.png]]<br>
**Replication**
	- Let's break down data replication in Amazon Dynamo. In simple terms, **data replication means making copies of your data and storing them on multiple different computers, or "nodes," within the Dynamo system**.
	- Think of it like having multiple copies of your favorite book. If one copy is lost or damaged, you still have others to read. Similarly, in a large system like Amazon's, where many servers can fail at any time, replicating data ensures that even if some servers go down, your data is still accessible. This is crucial for providing an "always-on" experience for Amazon's customers. Even a slight outage can have significant financial consequences and impact customer trust.
	- ##### Here's how Dynamo handles data replication:
		- **N Replicas:** For each piece of data (identified by a key), Dynamo stores **N copies**, where N is a number that can be configured. So, if N is set to 3, your data will be on three different nodes.
		- **Preference List:** When data for a specific key needs to be stored, Dynamo determines a **"preference list"** of N nodes that are responsible for holding these replicas.
		- **Consistent Hashing:** To figure out which nodes should be in this preference list, Dynamo uses a technique called **consistent hashing**. Imagine a ring where each node in the Dynamo system is assigned a position. When a piece of data needs to be stored, its key is also mapped to a position on this ring. The N nodes immediately following this key's position on the ring become the preference list for that data.
		- **Virtual Nodes:** To improve the distribution of data and handle different server capacities, Dynamo uses **"virtual nodes"**. Instead of each physical server having just one position on the ring, it can have multiple virtual positions (tokens). This helps to spread the data and the workload more evenly. If a server fails, the load is distributed across the remaining available servers.
		- **Coordinator Node:** When you want to store (put) or retrieve (get) data, your request goes to a **"coordinator" node**. For a write (put) operation, the coordinator sends the data to all N nodes in the preference list. For a read (get) operation, the coordinator asks for the data from the N nodes in the preference list.
		- **Eventual Consistency:** Because updates are sent to multiple replicas, there might be a slight delay before all copies are updated. Dynamo provides **"eventual consistency,"** meaning that all updates will eventually reach all replicas. However, in the short term, different replicas might have different versions of the data.
		- **Handling Failures (Sloppy Quorum and Hinted Handoff):** If some of the preferred N nodes are unavailable during a write, Dynamo uses a **"sloppy quorum"**. This means the write might be accepted by other healthy nodes that are not strictly in the top N of the preference list. The replica stored on this temporary node will have a "hint" indicating its intended destination. Once the intended node recovers, the temporary node will "handoff" the replica to it. This ensures high availability for writes.
		- **Data Versioning:** To manage the potential for inconsistencies when concurrent updates happen, Dynamo uses **vector clocks**. Each version of a piece of data has a vector clock that captures the history of updates. When reading data, you might get multiple versions if the system hasn't fully reconciled them yet. In these cases, the application might need to perform **conflict resolution** to decide which version is the correct one or to merge the different versions.
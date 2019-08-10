from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
from collections import Counter
from sklearn.naive_bayes import MultinomialNB, GaussianNB, BernoulliNB
from sklearn.svm import SVC, NuSVC, LinearSVC
from sklearn.metrics import confusion_matrix

app=Flask(__name__)
CORS(app)

def make_Dictionary(train_dir):
    emails = [os.path.join(train_dir, f) for f in os.listdir(train_dir)]
    all_words = []
    for mail in emails:
        with open(mail) as m:
            for line in m:
                words = line.split()
                all_words += words
    dictionary = Counter(all_words)
    list_to_remove = list(dictionary.keys())
    #delwords=['the', 'a', 'be', 'have', 'has', 'to', 'ect', 'and', 'for', 'of', 'on', 'in', 'an', 'is', 'hou','Subject:']
    for item in list_to_remove: #цикл починен
        # for word in delwords:
        #     if item == word:
        #         del dictionary[item]
        if item.isalpha() == False:
            del dictionary[item]
        elif len(item) == 1:
            del dictionary[item]
    dictionary = dictionary.most_common(4000)
    return dictionary

def extract_from_files(mail_dir): #функция составляет вектор правдоподобия в функцию передается словарь слов, и письмо
    files = [os.path.join(mail_dir, fi) for fi in os.listdir(mail_dir)]
    features_matrix = np.zeros((len(files), 4000))
    docID = 0
    for fil in files:
      with open(fil) as fi:
        for i, line in enumerate(fi):
          if i > 0:
            words = line.split()
            for word in words:
              wordID = 0
              for j, d in enumerate(dictionary):
                if d[0] == word:
                  wordID = j
                  features_matrix[docID, wordID] = words.count(word)
        docID = docID + 1
    return features_matrix

def extract_features(dir):
    message=str
    features_matrix = np.zeros((len(dir), 4000))
    mesID=0
    for i in dir:
        message=dir[i].split()
        print(message)
        for k, word in enumerate(message):
            if len(word) == 1:
                message.pop(k)
            elif word.isalpha()==False:
                message.pop(k)
        for word in message:
            wordID=0
            for j,d in enumerate(dictionary):
                if d[0]==word:
                    wordID=j
                    features_matrix[mesID,wordID]=message.count(word)
        mesID=mesID+1
    return features_matrix

train_dir="Spam\\train files"
dictionary = make_Dictionary(train_dir)
#----------------------------------------------------------------
train_labels = np.zeros(963)
train_labels[723:963] = 1
train_matrix = np.loadtxt('Spam\\matrix\\train_matrix', dtype=int)
#----------------------------------------------------------------
model1 = MultinomialNB()
model1.fit(train_matrix,train_labels)
#----------------------------------------------------------------

#----------------------------------------------------------------
@app.route('/')
def index():
    return "This is homepage"

@app.route('/dict')
def dict():
    print(dictionary)
    return "this is dict"

@app.route('/train_m')
def train_m():
    print(train_matrix)
    print(train_matrix.shape)
    return "this is train matrix"

@app.route('/result1/<fold>/<part>')#запрос для проверки большого числа сообщений
def res1(fold,part):
    test_dir = 'Spam\\lingspam_public\\'+fold+'\\'+part
    test_matrix = extract_from_files(test_dir)
    test_labels = np.zeros(289)
    test_labels[241:289] = 1
    result1 = model1.predict(test_matrix)
    print(confusion_matrix(test_labels,result1))
    return "this is result1"
    # test_dir = 'C:\\Users\\neoga\\PycharmProjects\\SpamFilter\\Mail Examples\\train'
    # test_matrix = extract_features(test_dir)
    # test_labels = np.zeros(578)
    # test_labels[483:578] = 1
    # result1 = model1.predict(test_matrix)
    # print(confusion_matrix(test_labels,result1))
    # return "this is result1"


@app.route('/processjson',methods=["GET","POST"])
def processjson():
    data=request.get_json()
    print(data)
    test_matrix=extract_features(data)
    result1 = model1.predict(test_matrix)
    print(result1)
    response={}
    k=0
    for i in data:
       response[i]=int(result1[k])
       k=k+1
    print(response)
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
    #np.savetxt('C:\\Users\\neoga\\PycharmProjects\\Server\\Spam\matrix\\train_matrix', train_matrix, fmt='%d')
    # print (confusion_matrix(test_labels, result1))
    # print (confusion_matrix(test_labels, result2))
